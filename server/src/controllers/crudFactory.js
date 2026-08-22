import { ApiError } from "../middleware/errors.js";
import { serialize } from "../models/base.js";
import { recordAudit } from "../services/auditService.js";

/**
 * Builds list/create/update/remove controller handlers for a Mongoose model.
 * Every admin resource (services, portfolio, case studies, ...) is otherwise
 * identical CRUD-plus-audit-log boilerplate, so it lives here once instead of
 * being copy-pasted per resource.
 */
export function createCrudController({ model, label, beforeDelete }) {
  async function list(req, res) {
    const limit = Math.min(Number(req.query.limit) || 100, 200);
    const skip = Number(req.query.skip) || 0;
    const [items, total] = await Promise.all([
      model.find().sort({ created_at: -1 }).skip(skip).limit(limit).lean(),
      model.countDocuments(),
    ]);
    res.json({ items: serialize(items), total });
  }

  async function create(req, res) {
    const doc = await model.create(req.validated);
    await recordAudit({
      user: req.user,
      action: `Created ${label}`,
      objectRepr: doc.title || doc.client_name || doc.id,
      changes: JSON.stringify(req.validated),
      ip: req.clientIp,
    });
    res.status(201).json({ item: serialize(doc) });
  }

  async function update(req, res) {
    const before = serialize(await model.findById(req.params.id).lean());
    if (!before) throw new ApiError(404, `${label} not found`);

    const doc = await model.findByIdAndUpdate(req.params.id, req.validated, {
      new: true,
      runValidators: true,
    });

    await recordAudit({
      user: req.user,
      action: `Updated ${label}`,
      objectRepr: doc.title || doc.client_name || doc.id,
      changes: JSON.stringify({ before, after: req.validated }),
      ip: req.clientIp,
    });
    res.json({ item: serialize(doc) });
  }

  async function remove(req, res) {
    const doc = await model.findById(req.params.id);
    if (!doc) throw new ApiError(404, `${label} not found`);

    if (beforeDelete) await beforeDelete(doc);

    await model.findByIdAndDelete(req.params.id);
    await recordAudit({
      user: req.user,
      action: `Deleted ${label}`,
      objectRepr: doc.title || doc.client_name || doc.id,
      ip: req.clientIp,
    });
    res.json({ status: "deleted", id: req.params.id });
  }

  return { list, create, update, remove };
}
