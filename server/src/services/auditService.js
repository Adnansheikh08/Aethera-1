import { AdminAuditLog } from "../models/AdminAuditLog.js";
import { serialize } from "../models/base.js";
import { logger } from "../utils/logger.js";

/**
 * Ported from apps/accounts/signals.py, which wrote an AdminAuditLog row on
 * every admin model change. Django emitted those from post_save/post_delete
 * signals; Mongoose middleware cannot see who performed the change, so the
 * admin route handlers call this explicitly instead.
 */
export async function recordAudit({ user, action, objectRepr = "", changes = "", ip = "" }) {
  try {
    await AdminAuditLog.create({
      user: user?.id || user?._id || user,
      username: user?.username || "",
      action,
      object_repr: String(objectRepr).slice(0, 200),
      changes: typeof changes === "string" ? changes : JSON.stringify(changes),
      ip,
      action_time: new Date(),
    });
  } catch (err) {
    // An audit write must never break the operation it is recording, but a
    // silent failure would defeat the point — so it is logged loudly.
    logger.error({ err: err.message, action }, "Failed to write admin audit log");
  }
}

export async function listAudit({ limit = 100, skip = 0 } = {}) {
  const [items, total] = await Promise.all([
    AdminAuditLog.find().sort({ action_time: -1 }).skip(skip).limit(Math.min(limit, 500)).lean(),
    AdminAuditLog.estimatedDocumentCount(),
  ]);
  return { items: serialize(items), total };
}
