/**
 * One-off: adds the four missing catalogue entries to the live database.
 *
 * Deliberately narrower than `npm run seed`. The seed's SERVICES list is keyed on
 * the canonical slugs (web-development, mobile-app-development, ...), but this
 * database holds the three hand-typed records web-dev / mobile-dev / a-d instead.
 * Running the full seed would therefore not recognise them as the same services
 * and would insert its own copies alongside, leaving nine entries. Only the four
 * that genuinely have no counterpart are inserted here; the existing three are
 * left exactly as they are.
 *
 * Slugs match client/src/data/serviceBackgrounds.js and the SERVICE_LABELS map in
 * server/src/models/Lead.js, so these four get their card artwork and already line
 * up with the contact form's dropdown values.
 *
 * Idempotent by slug — safe to re-run.
 */
import { connectDatabase, disconnectDatabase } from "../config/database.js";
import { Service } from "../models/Service.js";
import { logger } from "../utils/logger.js";

// Copy taken verbatim from scripts/seed.js so the two cannot describe the same
// service differently.
const SERVICES = [
  {
    slug: "mobile-app-development",
    title: "Mobile App Development",
    short_description:
      "High-fidelity native and cross-platform apps built for scalability and enterprise security.",
    description:
      "Our mobile engineering team delivers fluid native Android/iOS and cross-platform mobile apps with local-first offline syncing, strict encryption of local datastores, and biometric authentication integrations.",
    icon: '<svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12" y2="18.01" stroke-linecap="round"/></svg>',
    // The catalogue is ordered created_at ascending (services/agencyService.js),
    // so a plain insert would drop this in last, behind the vlog shoots. Pinned a
    // second past web-dev to restore the second slot the deleted `mobile-dev`
    // record used to hold.
    created_at: new Date("2026-08-22T09:38:31.000Z"),
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
  // Added after the six above and listed last on purpose: no pinned created_at, so
  // the catalogue's created_at ordering leaves them at the end of the grid.
  {
    slug: "ui-ux-design",
    title: "UI/UX Design",
    short_description:
      "Research-led interface and experience design, handed over as a production-ready design system.",
    description:
      "We start with discovery interviews and journey mapping, then prototype in high fidelity before a line of production code is written. Work ships as a versioned design system — tokens, components and accessibility annotations — so engineering builds from the same source of truth the design was signed off against.",
    icon: '<svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>',
  },
  {
    slug: "software-testing",
    title: "Software Testing",
    short_description:
      "Manual and automated QA across functional, regression, performance and security coverage.",
    description:
      "We build test strategy around risk rather than line count: automated regression suites wired into CI, exploratory manual passes on every release candidate, load and stress profiling against agreed SLAs, and reproducible defect reports triaged by severity so fixes land in the order that actually matters.",
    icon: '<svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>',
  },
];

await connectDatabase();

try {
  for (const { created_at: pinnedCreatedAt, ...fields } of SERVICES) {
    // eslint-disable-next-line no-await-in-loop
    const existing = await Service.findOne({ slug: fields.slug });
    if (existing) {
      console.log(`  skip    ${fields.slug} (already present)`);
    } else {
      // eslint-disable-next-line no-await-in-loop
      await Service.create(fields);
      console.log(`  created ${fields.slug}`);
    }

    if (pinnedCreatedAt) {
      // Written through the native driver on purpose. The `timestamps` option
      // registers created_at as an immutable path, so Mongoose drops it from a
      // $set without complaining — `{timestamps: false}` does not help, and the
      // document silently keeps its insert-time value and sorts to the end.
      // Guarded on the value so a re-run is a no-op rather than a rewrite.
      // eslint-disable-next-line no-await-in-loop
      const { modifiedCount } = await Service.collection.updateOne(
        { slug: fields.slug, created_at: { $ne: pinnedCreatedAt } },
        { $set: { created_at: pinnedCreatedAt } },
      );
      if (modifiedCount) console.log(`  pinned  ${fields.slug} into catalogue order`);
    }
  }

  const all = await Service.find({}, { slug: 1, title: 1, is_active: 1 })
    .sort({ created_at: 1 })
    .lean();
  console.log(`\nCatalogue is now ${all.length} services:`);
  for (const s of all) console.log(`  ${s.is_active ? "live  " : "hidden"} ${s.slug} — ${s.title}`);

  logger.info({ count: all.length }, "Catalogue top-up complete");
} catch (error) {
  logger.error({ err: error }, "Catalogue top-up failed");
  console.error(error.message);
  process.exitCode = 1;
} finally {
  await disconnectDatabase();
}
