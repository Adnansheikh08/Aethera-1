/**
 * Rebuilds a deleted portfolio item from the admin audit trail.
 *
 *   node src/scripts/restorePortfolioItem.js adnan-website
 *
 * The delete handler (controllers/crudFactory.js remove) records only the action
 * and the object's title — the document body is gone the moment it is deleted.
 * The create and update handlers, however, store the full validated payload in
 * AdminAuditLog.changes, and that collection is append-only. So a deleted item
 * can be reconstructed by replaying its own history: start from the "Created"
 * payload, then apply each later "Updated" entry's `after` block in order.
 *
 * created_at is pinned back to when the item was first created, because the
 * portfolio grid is ordered created_at descending — a plain insert would restore
 * the content but move the card to the front. The audit row's action_time is the
 * closest available stand-in for the original insert; comparing surviving items
 * with their own audit rows, it runs ~50ms late, which is far below anything that
 * could reorder the grid.
 *
 * Inserts only when the slug is genuinely absent, so this cannot clobber a live
 * document.
 */
import { connectDatabase, disconnectDatabase } from "../config/database.js";
import { AdminAuditLog } from "../models/AdminAuditLog.js";
import { PortfolioItem } from "../models/PortfolioItem.js";
import { Service } from "../models/Service.js";
import { logger } from "../utils/logger.js";

const slug = process.argv[2];
if (!slug) {
  console.error("Usage: node src/scripts/restorePortfolioItem.js <slug>");
  process.exit(1);
}

// Only the fields portfolioItemSchema actually defines; audit payloads also carry
// id/created_at/updated_at, which must not be written back as content.
const CONTENT_FIELDS = ["service", "title", "slug", "description", "project_url", "is_published"];

const pick = (source) =>
  Object.fromEntries(CONTENT_FIELDS.filter((f) => f in source).map((f) => [f, source[f]]));

await connectDatabase();

try {
  if (await PortfolioItem.findOne({ slug })) {
    console.log(`"${slug}" already exists — nothing to restore.`);
    process.exit(0);
  }

  const history = await AdminAuditLog.find({
    action: /portfolio item$/,
    changes: new RegExp(`"slug":"${slug}"`),
  })
    .sort({ action_time: 1 })
    .lean();

  if (!history.length) throw new Error(`No audit history found for "${slug}" — cannot reconstruct it.`);

  let item = null;
  let createdAt = null;

  for (const entry of history) {
    const payload = JSON.parse(entry.changes);

    if (entry.action.startsWith("Created")) {
      item = pick(payload);
      createdAt = entry.action_time;
      console.log(`  replaying ${entry.action_time.toISOString()}  ${entry.action}`);
    } else if (entry.action.startsWith("Updated") && payload.after) {
      item = { ...item, ...pick(payload.after) };
      console.log(`  replaying ${entry.action_time.toISOString()}  ${entry.action}`);
    }
  }

  if (!item) throw new Error(`Audit history for "${slug}" has no creation entry to start from.`);

  // The item is useless without its service, and Mongo will not catch a dangling
  // reference for us — the grid would render a card with a blank category badge.
  const service = await Service.findById(item.service).lean();
  if (!service) {
    throw new Error(
      `Cannot restore "${slug}": the service it referenced (${item.service}) no longer exists.`,
    );
  }

  console.log(`\nReconstructed:\n${JSON.stringify(item, null, 2)}`);
  console.log(`Service ${item.service} resolves to "${service.title}" (${service.slug}).`);

  const created = await PortfolioItem.create(item);

  // See the note above: `timestamps` registers created_at as an immutable path, so
  // Mongoose silently drops it from a $set. The native driver is the way in.
  await PortfolioItem.collection.updateOne(
    { _id: created._id },
    { $set: { created_at: createdAt } },
  );

  console.log(`\nRestored "${slug}" (created_at pinned to ${createdAt.toISOString()}).`);

  console.log("\nPortfolio grid is now, newest first:");
  for (const p of await PortfolioItem.find({}, { slug: 1, title: 1, is_published: 1 })
    .sort({ created_at: -1 })
    .lean()) {
    console.log(`  ${p.is_published ? "live  " : "hidden"} ${p.slug} — ${p.title}`);
  }

  logger.info({ slug }, "Portfolio item restored from audit trail");
} catch (error) {
  logger.error({ err: error }, "Portfolio restore failed");
  console.error(error.message);
  process.exitCode = 1;
} finally {
  await disconnectDatabase();
}
