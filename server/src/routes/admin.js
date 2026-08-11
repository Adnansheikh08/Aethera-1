import express from "express";

import { asyncHandler, ApiError } from "../middleware/errors.js";
import { requireAuth, attachUser } from "../middleware/auth.js";
import {
  validate,
  serviceSchema,
  portfolioItemSchema,
  caseStudySchema,
  leadStatusSchema,
} from "../validators/schemas.js";
import { serialize } from "../models/base.js";
import { Service } from "../models/Service.js";
import { PortfolioItem } from "../models/PortfolioItem.js";
import { CaseStudy } from "../models/CaseStudy.js";
import { Lead } from "../models/Lead.js";
import { Transaction } from "../models/Transaction.js";
import { DataErasureRequest } from "../models/DataErasureRequest.js";
import { assertServiceUnreferenced } from "../services/agencyService.js";
import { listLeads, decryptLead } from "../services/leadService.js";
import { recordAudit, listAudit } from "../services/auditService.js";

/**
 * Replaces the Django admin site (apps/accounts/admin.py admin_site), which
 * was OTP-gated and mounted at an obfuscated path. Every route here requires
 * a valid access token, which is only issued after TOTP succeeds.
 */
const router = express.Router();

router.use(requireAuth, attachUser);

/** Generic CRUD factory — the models differ only in schema and audit label. */
function crudRoutes({ path, model, schema, label, beforeDelete }) {
  router.get(
    path,
    asyncHandler(async (req, res) => {
      const limit = Math.min(Number(req.query.limit) || 100, 200);
      const skip = Number(req.query.skip) || 0;
      const [items, total] = await Promise.all([
        model.find().sort({ created_at: -1 }).skip(skip).limit(limit).lean(),
        model.countDocuments(),
      ]);
      res.json({ items: serialize(items), total });
    }),
  );

  router.post(
    path,
    validate(schema),
    asyncHandler(async (req, res) => {
      const doc = await model.create(req.validated);
      await recordAudit({
        user: req.user,
        action: `Created ${label}`,
        objectRepr: doc.title || doc.client_name || doc.id,
        changes: JSON.stringify(req.validated),
        ip: req.clientIp,
      });
      res.status(201).json({ item: serialize(doc) });
    }),
  );

  router.put(
    `${path}/:id`,
    validate(schema),
    asyncHandler(async (req, res) => {
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
    }),
  );

  router.delete(
    `${path}/:id`,
    asyncHandler(async (req, res) => {
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
    }),
  );
}

crudRoutes({
  path: "/services",
  model: Service,
  schema: serviceSchema,
  label: "service",
  // Reinstates Django's on_delete=PROTECT.
  beforeDelete: (doc) => assertServiceUnreferenced(doc._id),
});

crudRoutes({
  path: "/portfolio",
  model: PortfolioItem,
  schema: portfolioItemSchema,
  label: "portfolio item",
});

crudRoutes({
  path: "/case-studies",
  model: CaseStudy,
  schema: caseStudySchema,
  label: "case study",
});

/** Leads are read-only apart from status: PII must not be editable in place. */
router.get(
  "/leads",
  asyncHandler(async (req, res) => {
    const { status, limit, skip } = req.query;
    res.json(
      await listLeads({
        status,
        limit: Number(limit) || 50,
        skip: Number(skip) || 0,
      }),
    );
  }),
);

router.get(
  "/leads/:id",
  asyncHandler(async (req, res) => {
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
  }),
);

router.patch(
  "/leads/:id/status",
  validate(leadStatusSchema),
  asyncHandler(async (req, res) => {
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
  }),
);

router.get(
  "/transactions",
  asyncHandler(async (req, res) => {
    const limit = Math.min(Number(req.query.limit) || 100, 200);
    const [items, total] = await Promise.all([
      Transaction.find().sort({ created_at: -1 }).limit(limit).lean(),
      Transaction.countDocuments(),
    ]);
    res.json({ items: serialize(items), total });
  }),
);

router.get(
  "/erasure-requests",
  asyncHandler(async (_req, res) => {
    const items = await DataErasureRequest.find().sort({ created_at: -1 }).lean();
    res.json({ items: serialize(items), total: items.length });
  }),
);

router.get(
  "/audit-log",
  asyncHandler(async (req, res) => {
    res.json(
      await listAudit({ limit: Number(req.query.limit) || 100, skip: Number(req.query.skip) || 0 }),
    );
  }),
);

/** Dashboard summary counts. */
router.get(
  "/stats",
  asyncHandler(async (_req, res) => {
    const [services, portfolio, caseStudies, leads, newLeads, transactions, erasures] =
      await Promise.all([
        Service.countDocuments({ is_active: true }),
        PortfolioItem.countDocuments({ is_published: true }),
        CaseStudy.countDocuments({ is_published: true }),
        Lead.countDocuments(),
        Lead.countDocuments({ status: "NEW" }),
        Transaction.countDocuments(),
        DataErasureRequest.countDocuments({ status: "COMPLETED" }),
      ]);
    res.json({
      services,
      portfolio_items: portfolio,
      case_studies: caseStudies,
      leads,
      new_leads: newLeads,
      transactions,
      completed_erasures: erasures,
    });
  }),
);

export default router;
