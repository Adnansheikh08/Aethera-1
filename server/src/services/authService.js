import crypto from "node:crypto";

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import qrcode from "qrcode";
import speakeasy from "speakeasy";

import { config } from "../config/index.js";
import { User } from "../models/User.js";
import { ApiError } from "../middleware/errors.js";
import { logger } from "../utils/logger.js";
import { cache } from "../utils/cache.js";
import { registerSecurityViolation } from "./securityService.js";

/**
 * Replaces django-two-factor-auth + django_otp.
 *
 * The Django stack gave session login, TOTP devices and the OTP-gated admin
 * site out of the box. This module reimplements that as stateless JWT auth
 * with a mandatory TOTP second factor.
 *
 * Login is deliberately two-step, mirroring two_factor's flow:
 *   1. username + password  -> short-lived "pending 2FA" token
 *   2. that token + TOTP    -> access + refresh tokens
 */

const PENDING_TTL_SECONDS = 300; // 5 minutes to complete the second factor
const LOGIN_ATTEMPT_LIMIT = 5;
const LOGIN_ATTEMPT_WINDOW = 900; // 15 minutes

function signAccessToken(user) {
  return jwt.sign(
    { sub: user.id, username: user.username, is_superuser: user.is_superuser, typ: "access" },
    config.jwt.accessSecret,
    { expiresIn: config.jwt.accessTtl },
  );
}

function signRefreshToken(user) {
  return jwt.sign(
    { sub: user.id, tv: user.token_version, typ: "refresh" },
    config.jwt.refreshSecret,
    { expiresIn: config.jwt.refreshTtl },
  );
}

function signPendingToken(user) {
  return jwt.sign({ sub: user.id, typ: "pending_2fa" }, config.jwt.accessSecret, {
    expiresIn: PENDING_TTL_SECONDS,
  });
}

/**
 * Throttles credential stuffing per username+IP. Django's admin had no such
 * limiter, but an exposed JSON login endpoint needs one.
 */
function assertNotThrottled(key) {
  const attempts = cache.get(`login_attempts:${key}`, 0) || 0;
  if (attempts >= LOGIN_ATTEMPT_LIMIT) {
    throw new ApiError(429, "Too many failed login attempts. Try again later.");
  }
}

function recordFailedLogin(key, ip) {
  const attempts = (cache.get(`login_attempts:${key}`, 0) || 0) + 1;
  cache.set(`login_attempts:${key}`, attempts, LOGIN_ATTEMPT_WINDOW);
  if (attempts >= LOGIN_ATTEMPT_LIMIT) {
    registerSecurityViolation(ip, "Repeated failed admin login attempts");
  }
}

function clearFailedLogins(key) {
  cache.delete(`login_attempts:${key}`);
}

/** Step 1: verify credentials, return a token that only unlocks step 2. */
export async function authenticate({ username, password, ip }) {
  const throttleKey = `${String(username).toLowerCase()}:${ip}`;
  assertNotThrottled(throttleKey);

  const user = await User.findOne({ username, is_active: true }).select(
    "+password_hash +totp_secret",
  );

  // Always run a bcrypt comparison, even when the user is missing, so response
  // timing does not reveal which usernames exist.
  const valid = user
    ? await user.verifyPassword(password)
    : await bcrypt.compare(String(password), "$2a$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidin");

  if (!user || !valid) {
    recordFailedLogin(throttleKey, ip);
    logger.warn({ ip }, "Failed admin login attempt");
    throw new ApiError(401, "Invalid credentials");
  }

  clearFailedLogins(throttleKey);

  if (!user.totp_confirmed) {
    // Matches two_factor's setup redirect: authenticated, but must enrol first.
    return {
      status: "SETUP_REQUIRED",
      pendingToken: signPendingToken(user),
    };
  }

  return { status: "OTP_REQUIRED", pendingToken: signPendingToken(user) };
}

function verifyPendingToken(pendingToken) {
  let payload;
  try {
    payload = jwt.verify(pendingToken, config.jwt.accessSecret);
  } catch {
    throw new ApiError(401, "Second-factor session expired. Sign in again.");
  }
  if (payload.typ !== "pending_2fa") {
    throw new ApiError(401, "Invalid second-factor token");
  }
  return payload;
}

/** Step 2: verify the TOTP code (or a recovery code) and issue real tokens. */
export async function verifyTotp({ pendingToken, code, ip }) {
  const payload = verifyPendingToken(pendingToken);

  const user = await User.findById(payload.sub).select(
    "+totp_secret +recovery_code_hashes",
  );
  if (!user || !user.is_active) throw new ApiError(401, "Account unavailable");

  const throttleKey = `totp:${user.id}:${ip}`;
  assertNotThrottled(throttleKey);

  const normalised = String(code || "").trim().replace(/\s+/g, "");

  // A 6-digit string is a TOTP code; anything else is treated as a recovery code.
  let ok = false;
  if (/^\d{6}$/.test(normalised)) {
    ok = speakeasy.totp.verify({
      secret: user.totp_secret,
      encoding: "base32",
      token: normalised,
      // One step of drift each way — the same tolerance django_otp defaulted to.
      window: 1,
    });
    // Replay guard: a valid code must not be reusable inside its own window.
    if (ok) {
      const replayKey = `totp_used:${user.id}:${normalised}`;
      if (cache.get(replayKey)) {
        ok = false;
      } else {
        cache.set(replayKey, true, 90);
      }
    }
  } else {
    ok = await user.consumeRecoveryCode(normalised);
    if (ok) await user.save();
  }

  if (!ok) {
    recordFailedLogin(throttleKey, ip);
    logger.warn({ ip, user: user.username }, "Failed TOTP verification");
    throw new ApiError(401, "Invalid verification code");
  }

  clearFailedLogins(throttleKey);

  user.last_login = new Date();
  await user.save();

  return {
    accessToken: signAccessToken(user),
    refreshToken: signRefreshToken(user),
    user: { id: user.id, username: user.username, is_superuser: user.is_superuser },
  };
}

/** Generates a TOTP secret + provisioning QR for first-time enrolment. */
export async function beginTotpEnrolment({ pendingToken }) {
  const payload = verifyPendingToken(pendingToken);

  const user = await User.findById(payload.sub).select("+totp_secret");
  if (!user) throw new ApiError(401, "Account unavailable");
  if (user.totp_confirmed) {
    throw new ApiError(400, "Two-factor authentication is already configured");
  }

  const secret = speakeasy.generateSecret({
    name: `Aethera (${user.username})`,
    issuer: "Aethera",
    length: 32,
  });

  user.totp_secret = secret.base32;
  await user.save();

  const qrDataUrl = await qrcode.toDataURL(secret.otpauth_url);
  return { secret: secret.base32, otpauthUrl: secret.otpauth_url, qrDataUrl };
}

/** Confirms enrolment, activating the device and issuing recovery codes. */
export async function confirmTotpEnrolment({ pendingToken, code }) {
  const payload = verifyPendingToken(pendingToken);

  const user = await User.findById(payload.sub).select(
    "+totp_secret +recovery_code_hashes",
  );
  if (!user) throw new ApiError(401, "Account unavailable");

  const ok = speakeasy.totp.verify({
    secret: user.totp_secret,
    encoding: "base32",
    token: String(code || "").trim(),
    window: 1,
  });
  if (!ok) throw new ApiError(400, "Verification code did not match");

  // Ten single-use recovery codes, shown once and stored only as hashes.
  const plainCodes = Array.from({ length: 10 }, () =>
    crypto.randomBytes(5).toString("hex").toUpperCase(),
  );
  user.recovery_code_hashes = await Promise.all(
    plainCodes.map((c) => bcrypt.hash(c, 10)),
  );
  user.totp_confirmed = true;
  user.last_login = new Date();
  await user.save();

  return {
    recoveryCodes: plainCodes,
    accessToken: signAccessToken(user),
    refreshToken: signRefreshToken(user),
    user: { id: user.id, username: user.username, is_superuser: user.is_superuser },
  };
}

/** Exchanges a refresh token for a new access token. */
export async function refreshAccessToken(refreshToken) {
  let payload;
  try {
    payload = jwt.verify(refreshToken, config.jwt.refreshSecret);
  } catch {
    throw new ApiError(401, "Invalid or expired refresh token");
  }
  if (payload.typ !== "refresh") throw new ApiError(401, "Invalid token type");

  const user = await User.findById(payload.sub);
  if (!user || !user.is_active) throw new ApiError(401, "Account unavailable");

  // token_version invalidates every outstanding refresh token on logout-all.
  if (payload.tv !== user.token_version) {
    throw new ApiError(401, "Session has been revoked");
  }

  return { accessToken: signAccessToken(user) };
}

/** Revokes every issued refresh token for a user. */
export async function revokeSessions(userId) {
  await User.findByIdAndUpdate(userId, { $inc: { token_version: 1 } });
}
