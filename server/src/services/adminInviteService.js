import crypto from "node:crypto";

import bcrypt from "bcryptjs";

import { config } from "../config/index.js";
import { ApiError } from "../middleware/errors.js";
import { ADMIN_PERMISSIONS, User } from "../models/User.js";
import { sendMail } from "../utils/mailer.js";

const INVITE_TTL_MS = 3 * 24 * 60 * 60 * 1000; // 3 days to redeem

/**
 * Invite-only admin provisioning. The link is emailed via utils/mailer.js
 * when SMTP is configured, and always returned to the caller too so the
 * super admin can hand-deliver it if mail delivery is not set up or fails.
 */
export async function createInvite({ email, permissions, invitedBy }) {
  const normalisedEmail = String(email).trim().toLowerCase();
  const existing = await User.findOne({ email: normalisedEmail });
  if (existing) throw new ApiError(409, "An admin with that email already exists");

  const cleanPermissions = Array.isArray(permissions)
    ? permissions.filter((p) => ADMIN_PERMISSIONS.includes(p))
    : [];

  const user = new User({
    username: normalisedEmail,
    email: normalisedEmail,
    is_superuser: false,
    is_staff: true,
    // Inactive until the invite is redeemed: even a leaked password_hash
    // placeholder cannot be used to sign in before then.
    is_active: false,
    permissions: cleanPermissions,
    invited_by: invitedBy,
  });

  // Selector + secret pattern: the id is the lookup key, the secret is the
  // only thing that proves possession of the link, and only its hash is kept.
  const secret = crypto.randomBytes(24).toString("base64url");
  user.invite_token_hash = await bcrypt.hash(secret, 10);
  user.invite_expires_at = new Date(Date.now() + INVITE_TTL_MS);
  // Placeholder so password_hash's `required` constraint is satisfied; this
  // hash matches no real password and is replaced on invite acceptance.
  await user.setPassword(crypto.randomBytes(24).toString("hex"));
  await user.save();

  const inviteToken = `${user.id}.${secret}`;
  const inviteLink = `${config.clientOrigin}/admin/invite?token=${inviteToken}`;
  const { sent } = await sendMail({
    to: normalisedEmail,
    subject: "You've been invited to the Aethera admin console",
    text: `You've been invited as an admin. Set your password within 3 days: ${inviteLink}`,
    html: `<p>You've been invited as an admin on Aethera.</p><p><a href="${inviteLink}">Set your password</a> (valid 3 days).</p>`,
  });

  return { user, inviteToken, inviteLink, emailed: sent, expiresAt: user.invite_expires_at };
}

export async function acceptInvite({ token, password }) {
  const [userId, secret] = String(token || "").split(".");
  if (!userId || !secret) throw new ApiError(400, "Invalid or expired invite");

  const user = await User.findById(userId).select("+invite_token_hash");
  if (!user || !user.invite_token_hash) throw new ApiError(400, "Invalid or expired invite");

  if (!user.invite_expires_at || user.invite_expires_at.getTime() < Date.now()) {
    throw new ApiError(400, "This invite has expired. Ask the super admin to resend it.");
  }

  const valid = await bcrypt.compare(secret, user.invite_token_hash);
  if (!valid) throw new ApiError(400, "Invalid or expired invite");

  await user.setPassword(password);
  user.invite_token_hash = "";
  user.invite_expires_at = null;
  user.is_active = true;
  await user.save();
}
