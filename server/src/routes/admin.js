import express from "express";

import { asyncHandler } from "../middleware/errors.js";
import { requireAuth, attachUser, requireSuperuser, requirePermission } from "../middleware/auth.js";
import {
  validate,
  serviceSchema,
  portfolioItemSchema,
  caseStudySchema,
  leadStatusSchema,
  inviteAdminSchema,
  updatePermissionsSchema,
  updateStatusSchema,
} from "../validators/schemas.js";
import { serviceController } from "../controllers/serviceController.js";
import { portfolioController } from "../controllers/portfolioController.js";
import { caseStudyController } from "../controllers/caseStudyController.js";
import { leadController } from "../controllers/leadController.js";
import { transactionController } from "../controllers/transactionController.js";
import { erasureRequestController } from "../controllers/erasureRequestController.js";
import { auditLogController } from "../controllers/auditLogController.js";
import { statsController } from "../controllers/statsController.js";
import { adminManagementController } from "../controllers/adminManagementController.js";

/**
 * Replaces the Django admin site (apps/accounts/admin.py admin_site), which
 * was OTP-gated and mounted at an obfuscated path. Every route here requires
 * a valid access token, which is only issued after TOTP succeeds.
 */
const router = express.Router();

router.use(requireAuth, attachUser);

/** Wires a CRUD controller (see controllers/crudFactory.js) up to REST routes, gated by permission. */
function crudRoutes(path, controller, schema, permission) {
  const gate = requirePermission(permission);
  router.get(path, gate, asyncHandler(controller.list));
  router.post(path, gate, validate(schema), asyncHandler(controller.create));
  router.put(`${path}/:id`, gate, validate(schema), asyncHandler(controller.update));
  router.delete(`${path}/:id`, gate, asyncHandler(controller.remove));
}

crudRoutes("/services", serviceController, serviceSchema, "services");
crudRoutes("/portfolio", portfolioController, portfolioItemSchema, "portfolio");
crudRoutes("/case-studies", caseStudyController, caseStudySchema, "case-studies");

/** Leads are read-only apart from status: PII must not be editable in place. */
const leadsGate = requirePermission("leads");
router.get("/leads", leadsGate, asyncHandler(leadController.list));
router.get("/leads/:id", leadsGate, asyncHandler(leadController.getOne));
router.patch(
  "/leads/:id/status",
  leadsGate,
  validate(leadStatusSchema),
  asyncHandler(leadController.updateStatus),
);

router.get(
  "/transactions",
  requirePermission("transactions"),
  asyncHandler(transactionController.list),
);
router.get(
  "/erasure-requests",
  requirePermission("erasure-requests"),
  asyncHandler(erasureRequestController.list),
);
router.get("/audit-log", requirePermission("audit-log"), asyncHandler(auditLogController.list));
router.get("/stats", asyncHandler(statsController.getStats));

/** Add/edit/disable admin accounts — restricted to the super admin. */
router.get("/admins", requireSuperuser, asyncHandler(adminManagementController.list));
router.post(
  "/admins/invite",
  requireSuperuser,
  validate(inviteAdminSchema),
  asyncHandler(adminManagementController.invite),
);
router.patch(
  "/admins/:id/permissions",
  requireSuperuser,
  validate(updatePermissionsSchema),
  asyncHandler(adminManagementController.setPermissions),
);
router.patch(
  "/admins/:id/status",
  requireSuperuser,
  validate(updateStatusSchema),
  asyncHandler(adminManagementController.setStatus),
);

export default router;
