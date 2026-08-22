import bcrypt from "bcryptjs";
import mongoose from "mongoose";

import { baseSchemaOptions } from "./base.js";

/** Resource keys an admin can be granted access to (see middleware/auth.js requirePermission). */
export const ADMIN_PERMISSIONS = [
  "services",
  "portfolio",
  "case-studies",
  "leads",
  "transactions",
  "erasure-requests",
  "audit-log",
];

/**
 * Replaces django.contrib.auth.User plus the django_otp TOTP device.
 *
 * Django gave us password hashing, the admin login and TOTP devices for free.
 * None of that exists in Express, so this model carries all three concerns:
 * credentials, the TOTP secret, and the confirmation flag that django_otp
 * used to decide whether a device was usable.
 */
const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
      maxlength: 150,
    },
    email: { type: String, default: "", trim: true, lowercase: true },
    password_hash: { type: String, required: true, select: false },

    is_active: { type: Boolean, default: true },
    is_staff: { type: Boolean, default: true },
    is_superuser: { type: Boolean, default: false },

    // --- TOTP (replaces django_otp.plugins.otp_totp) ---
    totp_secret: { type: String, default: "", select: false },
    // django_otp only honoured a device once confirmed; same gate here.
    totp_confirmed: { type: Boolean, default: false },
    // Single-use recovery codes, stored as bcrypt hashes.
    recovery_code_hashes: { type: [String], default: [], select: false },

    // Resource keys this admin may act on (see middleware/auth.js requirePermission).
    // Ignored for is_superuser accounts, which always have full access.
    permissions: { type: [String], default: [] },

    // --- Invite-only admin provisioning (replaces self-service signup) ---
    // Set while a seat is pending; cleared once the invite is redeemed.
    invite_token_hash: { type: String, default: "", select: false },
    invite_expires_at: { type: Date, default: null },
    invited_by: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },

    last_login: { type: Date, default: null },
    // Refresh-token invalidation: bumping this logs every session out.
    token_version: { type: Number, default: 0 },
  },
  baseSchemaOptions,
);

userSchema.methods.setPassword = async function setPassword(plain) {
  this.password_hash = await bcrypt.hash(plain, 12);
};

userSchema.methods.verifyPassword = async function verifyPassword(plain) {
  if (!this.password_hash) return false;
  return bcrypt.compare(plain, this.password_hash);
};

/** Consumes a recovery code, removing it so it cannot be reused. */
userSchema.methods.consumeRecoveryCode = async function consumeRecoveryCode(code) {
  const normalised = String(code || "").trim().replace(/\s+/g, "").toUpperCase();
  if (!normalised) return false;

  for (let i = 0; i < this.recovery_code_hashes.length; i += 1) {
    // eslint-disable-next-line no-await-in-loop
    if (await bcrypt.compare(normalised, this.recovery_code_hashes[i])) {
      this.recovery_code_hashes.splice(i, 1);
      return true;
    }
  }
  return false;
};

export const User = mongoose.model("User", userSchema);
