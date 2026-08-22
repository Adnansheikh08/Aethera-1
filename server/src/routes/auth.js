import express from "express";

import { asyncHandler } from "../middleware/errors.js";
import { requireAuth, attachUser } from "../middleware/auth.js";
import {
  validate,
  loginSchema,
  totpSchema,
  pendingOnlySchema,
  changePasswordSchema,
  acceptInviteSchema,
} from "../validators/schemas.js";
import {
  authenticate,
  verifyTotp,
  beginTotpEnrolment,
  confirmTotpEnrolment,
  refreshAccessToken,
  revokeSessions,
  changePassword,
} from "../services/authService.js";
import { acceptInvite } from "../services/adminInviteService.js";
import { recordAudit } from "../services/auditService.js";
import { config } from "../config/index.js";

const router = express.Router();

/**
 * Refresh tokens live in an httpOnly cookie so XSS cannot read them; the
 * access token is returned in the body for the SPA to hold in memory only.
 * This is the split django-two-factor-auth got for free from session cookies.
 */
const refreshCookieOptions = {
  httpOnly: true,
  secure: config.isProd,
  sameSite: "strict",
  path: "/api/auth",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

router.post(
  "/login",
  validate(loginSchema),
  asyncHandler(async (req, res) => {
    const result = await authenticate({
      username: req.validated.username,
      password: req.validated.password,
      ip: req.clientIp,
    });
    res.json(result);
  }),
);

router.post(
  "/totp/verify",
  validate(totpSchema),
  asyncHandler(async (req, res) => {
    const { accessToken, refreshToken, user } = await verifyTotp({
      pendingToken: req.validated.pendingToken,
      code: req.validated.code,
      ip: req.clientIp,
    });

    await recordAudit({
      user,
      action: user.is_superuser ? "Super admin signed in" : "Signed in",
      objectRepr: user.username,
      ip: req.clientIp,
    });

    res.cookie("refresh_token", refreshToken, refreshCookieOptions);
    res.json({ accessToken, user });
  }),
);

router.post(
  "/invite/accept",
  validate(acceptInviteSchema),
  asyncHandler(async (req, res) => {
    await acceptInvite({ token: req.validated.token, password: req.validated.password });
    res.json({ status: "invite_accepted" });
  }),
);

router.post(
  "/change-password",
  requireAuth,
  attachUser,
  validate(changePasswordSchema),
  asyncHandler(async (req, res) => {
    await changePassword({
      userId: req.user.id,
      currentPassword: req.validated.currentPassword,
      newPassword: req.validated.newPassword,
    });
    await recordAudit({
      user: req.user,
      action: "Changed own password",
      objectRepr: req.user.username,
      ip: req.clientIp,
    });
    res.json({ status: "password_changed" });
  }),
);

router.post(
  "/totp/setup",
  validate(pendingOnlySchema),
  asyncHandler(async (req, res) => {
    res.json(await beginTotpEnrolment({ pendingToken: req.validated.pendingToken }));
  }),
);

router.post(
  "/totp/confirm",
  validate(totpSchema),
  asyncHandler(async (req, res) => {
    const { recoveryCodes, accessToken, refreshToken, user } = await confirmTotpEnrolment({
      pendingToken: req.validated.pendingToken,
      code: req.validated.code,
    });

    await recordAudit({
      user,
      action: "Enrolled two-factor authentication",
      objectRepr: user.username,
      ip: req.clientIp,
    });

    res.cookie("refresh_token", refreshToken, refreshCookieOptions);
    res.json({ recoveryCodes, accessToken, user });
  }),
);

router.post(
  "/refresh",
  asyncHandler(async (req, res) => {
    const token = req.cookies?.refresh_token || req.body?.refreshToken;
    res.json(await refreshAccessToken(token));
  }),
);

router.post(
  "/logout",
  requireAuth,
  attachUser,
  asyncHandler(async (req, res) => {
    await revokeSessions(req.user.id);
    await recordAudit({
      user: req.user,
      action: "Signed out (all sessions revoked)",
      objectRepr: req.user.username,
      ip: req.clientIp,
    });
    res.clearCookie("refresh_token", { ...refreshCookieOptions, maxAge: undefined });
    res.json({ status: "signed_out" });
  }),
);

router.get(
  "/me",
  requireAuth,
  attachUser,
  asyncHandler(async (req, res) => {
    res.json({
      user: {
        id: req.user.id,
        username: req.user.username,
        email: req.user.email,
        is_superuser: req.user.is_superuser,
        last_login: req.user.last_login,
      },
    });
  }),
);

export default router;
