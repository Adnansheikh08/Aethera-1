import { ApiError } from "../middleware/errors.js";
import { config } from "../config/index.js";
import { serialize } from "../models/base.js";
import { User } from "../models/User.js";
import { createInvite } from "../services/adminInviteService.js";
import { recordAudit } from "../services/auditService.js";

/**
 * Super-admin-only: manage other admin accounts. Only the env-configured
 * super admin email ever holds is_superuser, so this only ever adds/edits/
 * disables basic admins — it cannot mint another superuser.
 */
export async function list(_req, res) {
  const users = await User.find().sort({ created_at: -1 }).lean();
  res.json({ items: serialize(users), total: users.length });
}

export async function invite(req, res) {
  const email = req.validated.email.trim().toLowerCase();
  if (email === config.superAdminEmail) {
    throw new ApiError(400, "That email is reserved for the super admin");
  }

  const { user, inviteLink, emailed, expiresAt } = await createInvite({
    email,
    permissions: req.validated.permissions,
    invitedBy: req.user.id,
  });

  await recordAudit({
    user: req.user,
    action: "Invited admin",
    objectRepr: email,
    changes: JSON.stringify({ permissions: req.validated.permissions }),
    ip: req.clientIp,
  });

  // The link is emailed when SMTP is configured, and returned either way so
  // the super admin can deliver it manually if delivery isn't set up or fails.
  res.status(201).json({
    item: serialize(user),
    inviteLink,
    emailed,
    expiresAt,
  });
}

export async function setPermissions(req, res) {
  const target = await User.findById(req.params.id);
  if (!target) throw new ApiError(404, "Admin not found");
  if (target.is_superuser) throw new ApiError(400, "The super admin already has full access");

  target.permissions = req.validated.permissions;
  await target.save();

  await recordAudit({
    user: req.user,
    action: "Updated admin permissions",
    objectRepr: target.email || target.username,
    changes: JSON.stringify({ permissions: target.permissions }),
    ip: req.clientIp,
  });
  res.json({ item: serialize(target) });
}

export async function setStatus(req, res) {
  const target = await User.findById(req.params.id);
  if (!target) throw new ApiError(404, "Admin not found");

  if (target.id === req.user.id) throw new ApiError(400, "You cannot change your own status");
  if (target.email === config.superAdminEmail) {
    throw new ApiError(400, "The super admin account cannot be disabled");
  }

  target.is_active = req.validated.is_active;
  // A disable must also kill any outstanding refresh tokens immediately.
  if (!target.is_active) target.token_version += 1;
  await target.save();

  await recordAudit({
    user: req.user,
    action: target.is_active ? "Re-enabled admin" : "Disabled admin",
    objectRepr: target.email || target.username,
    ip: req.clientIp,
  });
  res.json({ item: serialize(target) });
}

export const adminManagementController = { list, invite, setPermissions, setStatus };
