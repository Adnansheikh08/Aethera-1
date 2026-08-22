import { ApiError } from "../middleware/errors.js";
import { Lead } from "../models/Lead.js";
import { listLeads, decryptLead } from "../services/leadService.js";
import { recordAudit } from "../services/auditService.js";

/** Leads are read-only apart from status: PII must not be editable in place. */
export async function list(req, res) {
  const { status, limit, skip } = req.query;
  res.json(
    await listLeads({
      status,
      limit: Number(limit) || 50,
      skip: Number(skip) || 0,
    }),
  );
}

export async function getOne(req, res) {
  const lead = await Lead.findById(req.params.id);
  if (!lead) throw new ApiError(404, "Lead not found");

  // Reading decrypted PII is itself an auditable event.
  await recordAudit({
    user: req.user,
    action: "Viewed lead PII",
    objectRepr: `Lead ${lead.id}`,
    ip: req.clientIp,
  });
  res.json({ lead: decryptLead(lead) });
}

export async function updateStatus(req, res) {
  const lead = await Lead.findByIdAndUpdate(
    req.params.id,
    { status: req.validated.status },
    { new: true },
  );
  if (!lead) throw new ApiError(404, "Lead not found");

  await recordAudit({
    user: req.user,
    action: "Updated lead status",
    objectRepr: `Lead ${lead.id}`,
    changes: JSON.stringify({ status: req.validated.status }),
    ip: req.clientIp,
  });
  res.json({ lead: decryptLead(lead) });
}

export const leadController = { list, getOne, updateStatus };
