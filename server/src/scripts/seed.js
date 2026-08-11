/**
 * Seeds the content collections for a fresh database.
 *
 * Django had no fixture for this — the catalogue was typed into the admin and
 * only ever existed in db.sqlite3, which meant a new clone came up with an empty
 * landing page. The records below are the ones importLegacy.js carried over, so
 * a developer with no SQLite file gets the same site the migration produces.
 *
 * Content only. Users, leads, transactions and erasure requests are deliberately
 * absent: the first two are credentials, the rest are PII, and none of them
 * belong in a file that lives in the repo.
 *
 * Idempotent by slug — running it twice inserts nothing the second time, so it
 * is safe against the already-migrated production data. Pass --overwrite to make
 * it authoritative and push the copy below over whatever is in the database.
 *
 *   npm run seed
 *   npm run seed -- --overwrite
 *   npm run seed -- --reset       (drops content collections first)
 */
import { connectDatabase, disconnectDatabase } from "../config/database.js";
import { CaseStudy } from "../models/CaseStudy.js";
import { PortfolioItem } from "../models/PortfolioItem.js";
import { Service } from "../models/Service.js";
import { logger } from "../utils/logger.js";

const flags = new Set(process.argv.slice(2).filter((a) => a.startsWith("--")).map((a) => a.slice(2)));
const overwrite = flags.has("overwrite") || flags.has("reset");
const reset = flags.has("reset");

const SERVICES = [
  {
    slug: "web-development",
    title: "Web Development",
    short_description:
      "Production-grade custom web portals utilizing sliding-window cache pipelines and clean DDD architectures.",
    description:
      "We engineer secure, high-performance, and ultra-scalable web platforms designed for enterprise clients demanding zero downtime and maximum security compliance. Built with robust frameworks and optimized database access patterns.",
    icon: '<svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>',
  },
  {
    slug: "mobile-app-development",
    title: "Mobile App Development",
    short_description:
      "High-fidelity native and cross-platform apps built for scalability and enterprise security.",
    description:
      "Our mobile engineering team delivers fluid native Android/iOS and cross-platform mobile apps with local-first offline syncing, strict encryption of local datastores, and biometric authentication integrations.",
    icon: '<svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12" y2="18.01" stroke-linecap="round"/></svg>',
  },
  {
    slug: "digital-advertising-campaigns",
    title: "Digital Advertising & Campaigns",
    short_description:
      "Data-driven marketing and high-CTR campaigns built for conversions and sales tracking.",
    description:
      "We setup scalable ad account infrastructures, automate UTM tracking pipelines, audit pixel integrations, and run performance campaigns delivering maximum ROI on ad spend.",
    icon: '<svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none"><path d="M23 6l-9.5 9.5-5-5L1 18"/><polyline points="17 6 23 6 23 12"/></svg>',
  },
  {
    slug: "video-photo-editing",
    title: "Video & Photo Editing",
    short_description:
      "Cinema-grade post-production editing, sound design, and color grading services.",
    description:
      "We edit premium promotional videos, high-ticket sales assets, and corporate profiles using advanced coloring pipelines, sound remastering tools, and optimized rendering engines.",
    icon: '<svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none"><path d="M23 7a2 2 0 0 0-2-2H3a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h18a2 2 0 0 0 2-2V7z"/><polygon points="10 9 15 12 10 15 10 9"/></svg>',
  },
  {
    slug: "high-ctr-thumbnail-design",
    title: "High-CTR Thumbnail Design",
    short_description:
      "Psychology-driven visual click-triggers optimized for conversions and YouTube impressions.",
    description:
      "Every thumbnail design goes through statistical A/B tests. We utilize dynamic framing, high-contrast color systems, and text readability optimizations for extreme desktop and mobile visibility.",
    icon: '<svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>',
  },
  {
    slug: "on-location-vlog-shoots",
    title: "On-Location Blog & Vlog Shoots",
    short_description:
      "Professional multi-cam on-site video production and blogging logistics orchestration.",
    description:
      "Our location production team manages logistics, premium multi-camera capture configs (RED/Arri), sound capture arrays, and fast post-production handoff procedures.",
    icon: '<svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>',
  },
];

// `service` is a slug here and is resolved to an ObjectId below.
const PORTFOLIO = [
  {
    slug: "fintech-ledger-hardening",
    service: "web-development",
    title: "Fintech Ledger System Hardening",
    description:
      "Audited and encrypted banking deposit database handling $45M+ in monthly transactional volume.",
    project_url: "https://github.com/aethera-agency",
  },
  {
    slug: "e-commerce-campaign-optimization",
    service: "digital-advertising-campaigns",
    title: "E-Commerce scale ad campaigns",
    description:
      "Rebuilt digital campaign strategy for enterprise apparel retailer, reducing acquisition costs by 32%.",
    project_url: "https://aethera.agency",
  },
];

const CASE_STUDIES = [
  {
    slug: "apex-global-database-audit",
    service: "web-development",
    client_name: "Apex Global Solutions",
    challenge:
      "The legacy system processed high volume transactions, making slow encryption algorithms unviable. A low-overhead implementation was mandatory.",
    result:
      "Successfully encrypted PII with 100% security coverage while actually improving transaction speed by 140% using Redis caching layers.",
    metrics: "+140% speed / A+ ASVS",
  },
];

/**
 * Inserts missing documents, keyed by slug.
 *
 * Returns counts rather than logging inline so the caller can print one summary
 * line per collection.
 */
async function upsertAll(Model, rows) {
  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const row of rows) {
    // eslint-disable-next-line no-await-in-loop
    const existing = await Model.findOne({ slug: row.slug });

    if (!existing) {
      // eslint-disable-next-line no-await-in-loop
      await Model.create(row);
      created += 1;
    } else if (overwrite) {
      existing.set(row);
      // eslint-disable-next-line no-await-in-loop
      await existing.save();
      updated += 1;
    } else {
      skipped += 1;
    }
  }

  return { created, updated, skipped };
}

function report(label, { created, updated, skipped }) {
  console.log(
    `  ${label.padEnd(13)} ${created} created, ${updated} updated, ${skipped} left alone`,
  );
}

await connectDatabase();

try {
  if (reset) {
    // Content only — never the collections holding credentials or PII.
    await Promise.all([
      Service.deleteMany({}),
      PortfolioItem.deleteMany({}),
      CaseStudy.deleteMany({}),
    ]);
    logger.warn("Seed --reset: cleared services, portfolio and case studies");
  }

  const services = await upsertAll(Service, SERVICES);

  // Children reference their service by slug; resolve to ObjectIds now that
  // every service is guaranteed to exist.
  const idBySlug = new Map(
    (await Service.find({}, { slug: 1 }).lean()).map((s) => [s.slug, s._id]),
  );

  const resolve = (rows) =>
    rows.map((row) => {
      const id = idBySlug.get(row.service);
      if (!id) throw new Error(`Seed row "${row.slug}" references unknown service "${row.service}"`);
      return { ...row, service: id };
    });

  const portfolio = await upsertAll(PortfolioItem, resolve(PORTFOLIO));
  const caseStudies = await upsertAll(CaseStudy, resolve(CASE_STUDIES));

  console.log(overwrite ? "Seeded content (overwriting):" : "Seeded content:");
  report("services", services);
  report("portfolio", portfolio);
  report("case studies", caseStudies);

  const touched =
    services.created + portfolio.created + caseStudies.created ||
    services.updated + portfolio.updated + caseStudies.updated;
  if (!touched) console.log("Nothing to do — database already matches the seed.");

  logger.info({ services, portfolio, caseStudies }, "Seed complete");
} catch (error) {
  logger.error({ err: error }, "Seed failed");
  console.error(error.message);
  process.exitCode = 1;
} finally {
  await disconnectDatabase();
}
