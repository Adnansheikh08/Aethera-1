import express from "express";
import mongoose from "mongoose";

import { asyncHandler, ApiError } from "../middleware/errors.js";
import { validate, leadSchema, erasureSchema } from "../validators/schemas.js";
import { createLead, processDataErasure } from "../services/leadService.js";
import {
  getActiveServices,
  getFeaturedPortfolioItems,
  getPublishedCaseStudies,
  getServiceBySlug,
  getCaseStudyBySlug,
} from "../services/agencyService.js";
import { SERVICE_LABELS } from "../models/Lead.js";
import { cache } from "../utils/cache.js";
import { logger } from "../utils/logger.js";

const router = express.Router();

/**
 * Ported from apps/core/views.py health_check.
 * Same contract: 200 when healthy, 503 otherwise, with per-dependency detail.
 */
router.get(
  "/healthz",
  asyncHandler(async (_req, res) => {
    const health = { status: "healthy", database: "connected", cache: "connected" };
    let statusCode = 200;

    try {
      if (mongoose.connection.readyState !== 1) throw new Error("not connected");
      await mongoose.connection.db.admin().ping();
    } catch (err) {
      health.status = "unhealthy";
      health.database = `failed: ${err.message}`;
      statusCode = 503;
    }

    try {
      cache.set("health_check_ping", "pong", 2);
      if (cache.get("health_check_ping") !== "pong") {
        throw new Error("Cache read-write verification mismatch");
      }
    } catch (err) {
      health.status = "unhealthy";
      health.cache = `failed: ${err.message}`;
      statusCode = 503;
    }

    res.status(statusCode).json(health);
  }),
);

/**
 * Landing page payload. Replaces the context dict that apps/agency/views.py
 * landing_page() handed to the template — one request instead of three.
 */
router.get(
  "/content/landing",
  asyncHandler(async (_req, res) => {
    const [services, portfolioItems, caseStudies] = await Promise.all([
      getActiveServices(),
      getFeaturedPortfolioItems(),
      getPublishedCaseStudies(),
    ]);
    res.json({
      services,
      portfolio_items: portfolioItems,
      case_studies: caseStudies,
      service_choices: Object.entries(SERVICE_LABELS).map(([value, label]) => ({ value, label })),
    });
  }),
);

/**
 * Projects page payload: the full published portfolio plus the service list the
 * filter chips are built from, in one request like /content/landing.
 *
 * Same selector as the landing grid — getFeaturedPortfolioItems() never applied
 * a limit (the "featured" in the name is a Django port artefact), so it already
 * returns every published item newest-first, which is the whole index this page
 * wants. Landing and /projects therefore cannot disagree about what is live.
 */
router.get(
  "/content/projects",
  asyncHandler(async (_req, res) => {
    const [portfolioItems, services] = await Promise.all([
      getFeaturedPortfolioItems(),
      getActiveServices(),
    ]);
    res.json({ portfolio_items: portfolioItems, services });
  }),
);

router.get(
  "/services",
  asyncHandler(async (_req, res) => {
    res.json({ services: await getActiveServices() });
  }),
);

router.get(
  "/services/:slug",
  asyncHandler(async (req, res) => {
    res.json({ service: await getServiceBySlug(req.params.slug) });
  }),
);

router.get(
  "/case-studies/:slug",
  asyncHandler(async (req, res) => {
    res.json({ case_study: await getCaseStudyBySlug(req.params.slug) });
  }),
);

/**
 * Ported from apps/leads/views.py submit_lead.
 * The honeypot rejection deliberately mimics a validation error rather than
 * announcing itself, exactly as the Django form did.
 */
router.post(
  "/leads",
  validate(leadSchema),
  asyncHandler(async (req, res) => {
    const { website, ...payload } = req.validated;

    if (website) {
      logger.warn({ ip: req.clientIp }, "Honeypot triggered on lead submission");
      throw new ApiError(400, "Security verification mismatch.");
    }

    await createLead(payload);

    res.status(201).json({
      status: "success",
      message:
        "Your enterprise inquiry was logged securely. Our architects will connect shortly.",
    });
  }),
);

/**
 * Ported from apps/leads/views.py request_erasure.
 *
 * The Django view leaked whether an email existed in the database via its
 * error message. This returns the same acknowledgement either way, and logs
 * the real outcome server-side instead.
 */
router.post(
  "/erasure",
  validate(erasureSchema),
  asyncHandler(async (req, res) => {
    const found = await processDataErasure(req.validated.email);
    logger.info({ matched: found }, "Erasure request processed");

    res.json({
      status: "accepted",
      message:
        "If that address exists in our registries, the associated records have been scrubbed.",
    });
  }),
);

/** Ported from apps/agency/views.py robots_txt. */
router.get("/robots.txt", (req, res) => {
  const origin = `${req.protocol}://${req.get("host")}`;
  res
    .type("text/plain")
    .send(
      ["User-agent: *", `Disallow: /${process.env.ADMIN_URL_PATH || "portal-admin-8f2e9a7c"}/`, `Sitemap: ${origin}/sitemap.xml`].join("\n"),
    );
});

/** Ported from apps/agency/views.py sitemap_xml. */
router.get(
  "/sitemap.xml",
  asyncHandler(async (req, res) => {
    const origin = `${req.protocol}://${req.get("host")}`;
    const [services, caseStudies] = await Promise.all([
      getActiveServices(),
      getPublishedCaseStudies(),
    ]);

    const urls = [
      `<url><loc>${origin}/</loc><priority>1.0</priority></url>`,
      // No trailing slash: SiteMeta builds the canonical from the router's
      // pathname, so /projects/ here would advertise a URL the page itself
      // never claims as canonical.
      `<url><loc>${origin}/projects</loc><priority>0.9</priority></url>`,
      ...services.map(
        (s) => `<url><loc>${origin}/services/${s.slug}/</loc><priority>0.8</priority></url>`,
      ),
      ...caseStudies.map(
        (c) => `<url><loc>${origin}/case-studies/${c.slug}/</loc><priority>0.7</priority></url>`,
      ),
    ];

    res.type("application/xml").send(
      `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  ${urls.join("\n  ")}\n</urlset>`,
    );
  }),
);

export default router;
