/**
 * One-off: adds the SEO catalogue entry to the live database.
 *
 * Why not `npm run seed`: seed.js holds a subset of the live catalogue and the
 * live database carries records it does not know about (hand-typed web-dev /
 * mobile-dev / a-d, plus ui-ux-design and software-testing). Running the full
 * seed would therefore insert its own copies alongside them rather than
 * matching what is there. This script inserts only the one new service and
 * leaves the existing nine exactly as they are.
 *
 * No pinned created_at: the catalogue is ordered created_at ascending
 * (services/agencyService.js), so a plain insert drops SEO into the tenth slot
 * at the end of the grid, which is where a newly added service belongs.
 *
 * Idempotent by slug — safe to re-run.
 */
import { connectDatabase, disconnectDatabase } from "../config/database.js";
import { Service } from "../models/Service.js";
import { logger } from "../utils/logger.js";

const SERVICE = {
  slug: "seo",
  title: "SEO",
  short_description:
    "Data-driven SEO strategies to improve search visibility, organic traffic, and long-term Google rankings.",
  description:
    "Our SEO services are designed to help businesses improve their organic search visibility and turn search traffic into meaningful business opportunities. We combine technical optimization, content strategy, keyword research, and performance monitoring to build sustainable search growth.\n\nWhat We Provide\n\nTechnical SEO — Optimize website structure, crawlability, indexing, performance, and technical foundations so search engines can understand and access your website efficiently.\n\nOn-Page SEO — Optimize page titles, meta descriptions, headings, content structure, internal linking, URLs, and other on-page elements around relevant search intent.\n\nKeyword Research — Identify relevant, high-intent search terms and opportunities that align with your business, audience, services, and growth goals.\n\nLocal SEO — Improve local search visibility through location-focused optimization and a stronger presence for customers searching for your services nearby.\n\nGoogle Search Console & Indexing — Monitor indexing, search performance, sitemap status, crawl issues, and search visibility using Google Search Console.\n\nSEO Audits — Identify technical, content, performance, and on-page SEO issues and provide actionable recommendations for improvement.\n\nPerformance & Core Web Vitals — Improve page performance, loading experience, responsiveness, and other technical factors that contribute to a better user and search experience.\n\nWhy SEO Matters\n\nHigher organic search visibility\nMore qualified website traffic\nBetter discoverability for your services\nStronger long-term digital presence\nImproved technical website health\nData-driven search growth",
  // Lucide "search" glyph — kept for parity with the other nine records and for
  // the admin form. The public card's artwork comes from the slug lookup in
  // client/src/data/serviceBackgrounds.js, not from this field.
  icon: '<svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>',
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

  logger.info({ count: all.length }, "SEO catalogue insert complete");
} catch (error) {
  logger.error({ err: error }, "SEO catalogue insert failed");
  console.error(error.message);
  process.exitCode = 1;
} finally {
  await disconnectDatabase();
}
