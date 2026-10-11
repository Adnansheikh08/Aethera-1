import express from "express";
import mongoose from "mongoose";

import { config } from "../config/index.js";
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

/**
 * Ported from apps/agency/views.py robots_txt.
 *
 * nginx proxies /robots.txt to this route as well as /api/robots.txt: without
 * that the SPA fallback answers with index.html and a 200, and a crawler reads
 * the app shell as a robots file.
 */
router.get("/robots.txt", (_req, res) => {
  res
    .type("text/plain")
    .send(
      [
        "User-agent: *",
        `Disallow: /${config.adminUrlPath}/`,
        `Sitemap: ${config.siteUrl}/sitemap.xml`,
      ].join("\n"),
    );
});

/**
 * Static entries, in the order they are published. Everything here is a real
 * route on the SPA; the admin console and the 404 catch-all are left out
 * because they carry a noindex meta tag.
 */
const STATIC_PATHS = [
  { path: "/", priority: "1.0" },
  { path: "/projects", priority: "0.9" },
  { path: "/contact", priority: "0.8" },
  { path: "/privacy-policy", priority: "0.3" },
  { path: "/terms", priority: "0.3" },
];

/** A <loc> is XML text: a bare & or < would invalidate the whole document. */
const escapeXml = (value) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/**
 * Ported from apps/agency/views.py sitemap_xml, reached at /sitemap.xml through
 * the nginx proxy as well as at /api/sitemap.xml directly.
 *
 * Every loc is built from config.siteUrl rather than req.protocol + Host — see
 * the note on siteUrl in config/index.js for why the request cannot be trusted
 * to name the scheme.
 *
 * No path carries a trailing slash. SiteMeta builds the canonical from the
 * router's pathname, and React Router claims the slash-less form, so listing
 * /services/x/ would advertise a URL the page never canonicalises to and split
 * the two across duplicate-content handling.
 */
router.get(
  "/sitemap.xml",
  asyncHandler(async (_req, res) => {
    const [services, caseStudies] = await Promise.all([
      getActiveServices(),
      getPublishedCaseStudies(),
    ]);

    const entries = [
      ...STATIC_PATHS,
      ...services.map((s) => ({ path: `/services/${s.slug}`, priority: "0.8" })),
      ...caseStudies.map((c) => ({ path: `/case-studies/${c.slug}`, priority: "0.7" })),
    ];

    const urls = entries.map(
      ({ path, priority }) =>
        `<url><loc>${escapeXml(`${config.siteUrl}${path}`)}</loc><priority>${priority}</priority></url>`,
    );

    res.type("application/xml").send(
      `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  ${urls.join("\n  ")}\n</urlset>`,
    );
  }),
);

export default router;
