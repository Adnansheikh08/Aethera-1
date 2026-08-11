import jwt from "jsonwebtoken";

import { config } from "../config/index.js";
import { User } from "../models/User.js";
import { ApiError } from "./errors.js";

/**
 * Replaces django_otp.middleware.OTPMiddleware + the staff_member_required
 * gate on the admin site. A token is only ever issued after TOTP has been
 * satisfied, so possession of a valid access token implies 2FA passed.
 */
export function requireAuth(req, _res, next) {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    return next(new ApiError(401, "Authentication required"));
  }

  let payload;
  try {
    payload = jwt.verify(token, config.jwt.accessSecret);
  } catch (err) {
    const message =
      err.name === "TokenExpiredError" ? "Access token expired" : "Invalid access token";
    return next(new ApiError(401, message));
  }

  if (payload.typ !== "access") {
    return next(new ApiError(401, "Invalid token type"));
  }

  req.auth = { userId: payload.sub, username: payload.username, isSuperuser: payload.is_superuser };
  return next();
}

/** Loads the full user document for handlers that need more than the claims. */
export async function attachUser(req, _res, next) {
  if (!req.auth?.userId) return next(new ApiError(401, "Authentication required"));

  const user = await User.findById(req.auth.userId);
  if (!user || !user.is_active) return next(new ApiError(401, "Account unavailable"));

  req.user = user;
  return next();
}

export function requireSuperuser(req, _res, next) {
  if (!req.auth?.isSuperuser) {
    return next(new ApiError(403, "Superuser privileges required"));
  }
  return next();
}
