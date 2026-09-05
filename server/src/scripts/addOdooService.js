/**
 * One-off: adds the Odoo Implementation and Development catalogue entry to the
 * live database.
 *
 * Why not `npm run seed`: the live database still holds the hand-typed
 * web-dev / mobile-dev / a-d records the seed does not recognise (see
 * scripts/addMissingServices.js), so running the full seed would insert its
 * own copies alongside them. This script inserts only the one new service and
 * leaves the existing eight exactly as they are.
 *
 * Record copied verbatim from scripts/seed.js so the two cannot describe the
 * service differently.
 *
 * Idempotent by slug — safe to re-run.
 */
import { connectDatabase, disconnectDatabase } from "../config/database.js";
import { Service } from "../models/Service.js";
import { logger } from "../utils/logger.js";

const SERVICE = {
  slug: "odoo-erp-solutions",
  title: "Odoo Implementation and Development",
  short_description:
    "End-to-end Odoo implementation, custom module development, integrations, automation, and business workflow optimization.",
  description:
    "We build and customize Odoo ERP solutions to help businesses streamline operations, automate workflows, and manage their business processes from a unified platform. Our Odoo services cover the full lifecycle — from initial implementation and configuration to custom module development, third-party integrations, and ongoing technical support.\n\nWhat We Provide\n\nCustom Odoo Module Development — We design, build, and maintain bespoke Odoo modules that fit your business processes exactly, following Odoo's framework standards so future upgrades stay painless.\n\nOdoo Customization — We tailor existing Odoo apps to your operations: views, reports, fields, business logic, and access rules adjusted to how your teams actually work.\n\nOdoo Third-Party Integrations — We connect Odoo with your wider toolchain — payment gateways, e-commerce platforms, CRMs, shipping providers, and internal APIs — so data moves automatically instead of being re-keyed.\n\nBusiness Workflow Automation — We map, streamline, and automate approvals, notifications, and hand-offs inside Odoo, cutting manual steps and the errors they introduce.\n\nOdoo Implementation & Configuration — We set up Odoo around your organisation: apps selected and configured, data migrated, users and permissions structured, and your team taken live with confidence.\n\nOdoo Technical Support & Maintenance — We stay on after go-live with debugging, performance tuning, version upgrades, and module maintenance, keeping your Odoo environment healthy as you grow.",
  // Lucide "workflow" glyph — two workflow nodes joined by a routed path.
  icon: '<svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none"><rect x="3" y="3" width="8" height="8" rx="1" ry="1"/><path d="M7 11v4a2 2 0 0 0 2 2h4"/><rect x="13" y="13" width="8" height="8" rx="1" ry="1"/></svg>',
};

await connectDatabase();

try {
  const existing = await Service.findOne({ slug: SERVICE.slug });
  if (existing) {
    console.log(`  skip    ${SERVICE.slug} (already present)`);
  } else {
    await Service.create(SERVICE);
    console.log(`  created ${SERVICE.slug}`);
  }

  const all = await Service.find({}, { slug: 1, title: 1, is_active: 1 })
    .sort({ created_at: 1 })
    .lean();
  console.log(`\nCatalogue is now ${all.length} services:`);
  for (const s of all) console.log(`  ${s.is_active ? "live  " : "hidden"} ${s.slug} — ${s.title}`);

  logger.info({ count: all.length }, "Odoo catalogue insert complete");
} catch (error) {
  logger.error({ err: error }, "Odoo catalogue insert failed");
  console.error(error.message);
  process.exitCode = 1;
} finally {
  await disconnectDatabase();
}
