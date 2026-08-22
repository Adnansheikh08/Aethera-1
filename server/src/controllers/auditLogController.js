import { listAudit } from "../services/auditService.js";

export async function list(req, res) {
  res.json(
    await listAudit({ limit: Number(req.query.limit) || 100, skip: Number(req.query.skip) || 0 }),
  );
}

export const auditLogController = { list };
