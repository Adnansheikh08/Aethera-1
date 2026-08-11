/**
 * One-time SQLite -> MongoDB migration.
 *
 * Reads the Django db.sqlite3 directly and rewrites every row into Mongo.
 * The only genuinely dangerous part is the lead PII: those three columns are
 * Fernet tokens produced by cryptography.MultiFernet, and the new stack uses
 * AES-256-GCM. Each value is therefore decrypted with the legacy reader and
 * re-encrypted before it is written.
 *
 * Safety properties, in the order they matter:
 *   1. SQLite is opened read-only. This script can never damage the source.
 *   2. Nothing is written until every lead has been successfully decrypted, so
 *      a bad key aborts the run rather than half-populating the database.
 *   3. It is idempotent — re-running upserts by slug/email_hash instead of
 *      duplicating.
 *   4. --dry-run reports exactly what would happen and writes nothing.
 *
 * Usage:
 *   node src/scripts/importLegacy.js --dry-run
 *   node src/scripts/importLegacy.js
 *   node src/scripts/importLegacy.js --sqlite ../db.sqlite3
 */
import { DatabaseSync } from "node:sqlite";
import crypto from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mongoose from "mongoose";

import { config } from "../config/index.js";
import { connectDatabase } from "../config/database.js";
import { encrypt, getEmailHash } from "../utils/crypto.js";
import { multiFernetDecrypt, deriveLegacyFallbackKey } from "../utils/legacyFernet.js";
import { Service } from "../models/Service.js";
import { PortfolioItem } from "../models/PortfolioItem.js";
import { CaseStudy } from "../models/CaseStudy.js";
import { Lead } from "../models/Lead.js";
import { DataErasureRequest } from "../models/DataErasureRequest.js";
import { Transaction } from "../models/Transaction.js";
import { AdminAuditLog } from "../models/AdminAuditLog.js";
import { User } from "../models/User.js";

const here = path.dirname(fileURLToPath(import.meta.url));

function parseArgs(argv) {
  const out = { dryRun: false, sqlite: path.resolve(here, "../../../db.sqlite3") };
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === "--dry-run") out.dryRun = true;
    else if (argv[i] === "--sqlite") out.sqlite = path.resolve(argv[++i]);
  }
  return out;
}

/**
 * Django stored naive UTC strings like "2026-08-10 07:22:31.123456".
 * `new Date()` on that reads it as local time, which would shift every
 * timestamp by the machine's offset — so the UTC marker is added explicitly.
 */
function toDate(value) {
  if (!value) return null;
  if (value instanceof Date) return value;
  const text = String(value).trim();
  const iso = text.includes("T") ? text : text.replace(" ", "T");
  const stamped = /[Zz]|[+-]\d{2}:?\d{2}$/.test(iso) ? iso : `${iso}Z`;
  const parsed = new Date(stamped);
  if (Number.isNaN(parsed.getTime())) throw new Error(`Unparseable datetime: ${value}`);
  return parsed;
}

const bool = (v) => v === 1 || v === true || v === "1";

// ---------------------------------------------------------------------------

const args = parseArgs(process.argv.slice(2));
const label = args.dryRun ? "[dry-run]" : "[migrate]";
const stats = {};
const note = (key, n) => {
  stats[key] = (stats[key] || 0) + n;
};

// The legacy keyring, in MultiFernet order: FIELD_ENCRYPTION_KEY entries first,
// then the SECRET_KEY-derived fallback the app used when none were configured.
const legacyKeys = [
  ...(config.legacyFernetKeys?.length ? config.legacyFernetKeys : config.fieldEncryptionKeys || []),
  deriveLegacyFallbackKey(config.secretKey),
].filter(Boolean);

console.log(`${label} source : ${args.sqlite}`);
console.log(`${label} target : ${config.mongoUri}`);
console.log(`${label} legacy decryption keys available: ${legacyKeys.length}`);

const db = new DatabaseSync(args.sqlite, { readOnly: true });
const rows = (sql) => db.prepare(sql).all();

// --- Phase 1: decrypt everything up front, before any write ----------------
// A wrong key must fail the whole run, not leave Mongo half-migrated.
console.log(`\n${label} phase 1: decrypting lead PII`);

const legacyLeads = rows(`
  SELECT id, created_at, updated_at, encrypted_name, encrypted_email,
         encrypted_phone, email_hash, service_type, status, additional_info
  FROM leads_lead ORDER BY id
`);

const decryptedLeads = legacyLeads.map((row) => {
  const decryptField = (value, field) => {
    if (!value) return "";
    try {
      return multiFernetDecrypt(value, legacyKeys);
    } catch (err) {
      throw new Error(`lead id=${row.id} field=${field}: ${err.message}`);
    }
  };

  const name = decryptField(row.encrypted_name, "encrypted_name");
  const email = decryptField(row.encrypted_email, "encrypted_email");
  const phone = decryptField(row.encrypted_phone, "encrypted_phone");

  // The pepper is unchanged, so a recomputed hash must equal the stored one.
  // If it does not, erasure-by-email would silently stop matching this row.
  const recomputed = getEmailHash(email);
  if (row.email_hash && recomputed !== row.email_hash) {
    throw new Error(
      `lead id=${row.id}: email_hash mismatch — stored ${row.email_hash}, ` +
        `recomputed ${recomputed}. SECRET_KEY does not match the one that wrote this row.`,
    );
  }

  return { row, name, email, phone, emailHash: recomputed || row.email_hash };
});

console.log(`${label}   ${decryptedLeads.length} lead(s) decrypted, all email_hashes verified`);

if (args.dryRun) {
  // Prove the plaintext is real without printing it — a length and a masked
  // form is enough to confirm the keys work.
  for (const { row, name, email, phone } of decryptedLeads) {
    const mask = (s) => (s ? `${s.slice(0, 2)}***${s.slice(-2)} (${s.length} chars)` : "(empty)");
    console.log(
      `${label}   lead ${row.id}: name=${mask(name)} email=${mask(email)} phone=${mask(phone)}`,
    );
  }
}

await connectDatabase();

// --- Phase 2: agency content ----------------------------------------------
// Integer FKs become ObjectIds, so the id map is built as services are written.
console.log(`\n${label} phase 2: services, portfolio, case studies`);

const serviceIdMap = new Map();

for (const row of rows("SELECT * FROM agency_service ORDER BY id")) {
  const doc = {
    title: row.title,
    slug: row.slug,
    short_description: row.short_description ?? "",
    description: row.description ?? "",
    icon: row.icon ?? "",
    is_active: bool(row.is_active),
    created_at: toDate(row.created_at),
    updated_at: toDate(row.updated_at),
  };

  if (args.dryRun) {
    const existing = await Service.findOne({ slug: row.slug }).lean();
    console.log(`${label}   service "${row.slug}" -> ${existing ? "update" : "insert"}`);
    serviceIdMap.set(row.id, existing?._id ?? new mongoose.Types.ObjectId());
  } else {
    const saved = await Service.findOneAndUpdate(
      { slug: row.slug },
      { $set: doc },
      { upsert: true, new: true, setDefaultsOnInsert: true, timestamps: false },
    );
    serviceIdMap.set(row.id, saved._id);
  }
  note("services", 1);
}

for (const row of rows("SELECT * FROM agency_portfolioitem ORDER BY id")) {
  const serviceId = serviceIdMap.get(row.service_id);
  if (!serviceId) throw new Error(`portfolio id=${row.id}: unknown service_id ${row.service_id}`);

  const doc = {
    service: serviceId,
    title: row.title,
    slug: row.slug,
    description: row.description ?? "",
    project_url: row.project_url ?? "",
    is_published: bool(row.is_published),
    created_at: toDate(row.created_at),
    updated_at: toDate(row.updated_at),
  };

  if (args.dryRun) console.log(`${label}   portfolio "${row.slug}"`);
  else {
    await PortfolioItem.findOneAndUpdate(
      { slug: row.slug },
      { $set: doc },
      { upsert: true, setDefaultsOnInsert: true, timestamps: false },
    );
  }
  note("portfolio_items", 1);
}

for (const row of rows("SELECT * FROM agency_casestudy ORDER BY id")) {
  const serviceId = serviceIdMap.get(row.service_id);
  if (!serviceId) throw new Error(`case study id=${row.id}: unknown service_id ${row.service_id}`);

  const doc = {
    service: serviceId,
    client_name: row.client_name,
    slug: row.slug,
    challenge: row.challenge ?? "",
    result: row.result ?? "",
    metrics: row.metrics ?? "",
    is_published: bool(row.is_published),
    created_at: toDate(row.created_at),
    updated_at: toDate(row.updated_at),
  };

  if (args.dryRun) console.log(`${label}   case study "${row.slug}"`);
  else {
    await CaseStudy.findOneAndUpdate(
      { slug: row.slug },
      { $set: doc },
      { upsert: true, setDefaultsOnInsert: true, timestamps: false },
    );
  }
  note("case_studies", 1);
}

// --- Phase 3: leads, re-encrypted -----------------------------------------
console.log(`\n${label} phase 3: leads (Fernet -> AES-256-GCM)`);

for (const { row, name, email, phone, emailHash } of decryptedLeads) {
  const doc = {
    encrypted_name: encrypt(name),
    encrypted_email: encrypt(email),
    encrypted_phone: encrypt(phone),
    email_hash: emailHash,
    service_type: row.service_type,
    status: row.status,
    additional_info: row.additional_info ?? "",
    created_at: toDate(row.created_at),
    updated_at: toDate(row.updated_at),
  };

  if (args.dryRun) console.log(`${label}   lead ${row.id} -> re-encrypted (${row.status})`);
  else {
    // Keyed on the legacy row id, NOT email_hash. email_hash is only an INDEX
    // in Django, not a unique constraint — the same person can enquire twice
    // (rows 1 and 4 do exactly that), and keying on it silently overwrites the
    // earlier enquiry. The ciphertext cannot be a key either: the GCM nonce is
    // random, so it differs on every encrypt.
    await Lead.findOneAndUpdate(
      { legacy_id: row.id },
      { $set: { ...doc, legacy_id: row.id } },
      { upsert: true, setDefaultsOnInsert: true, timestamps: false },
    );
  }
  note("leads", 1);
}

// --- Phase 4: erasure requests, transactions --------------------------------
console.log(`\n${label} phase 4: erasure requests, transactions`);

for (const row of rows("SELECT * FROM leads_dataerasurerequest ORDER BY id")) {
  const doc = {
    email_hash: row.email_hash,
    status: row.status,
    completed_at: toDate(row.completed_at),
    created_at: toDate(row.created_at),
    updated_at: toDate(row.updated_at),
  };
  if (!args.dryRun) {
    // email_hash is UNIQUE in both schemas, so it is the natural key.
    await DataErasureRequest.findOneAndUpdate(
      { email_hash: row.email_hash },
      { $set: doc },
      { upsert: true, setDefaultsOnInsert: true, timestamps: false },
    );
  }
  note("erasure_requests", 1);
}

for (const row of rows("SELECT * FROM payments_transaction ORDER BY id")) {
  const doc = {
    checkout_session_id: row.checkout_session_id,
    payment_gateway: row.payment_gateway,
    amount: mongoose.Types.Decimal128.fromString(String(row.amount)),
    currency: row.currency,
    status: row.status,
    created_at: toDate(row.created_at),
    updated_at: toDate(row.updated_at),
  };
  if (row.lead_id) {
    // Resolved by legacy id, not email_hash — a shared hash would otherwise
    // attach the transaction to whichever enquiry happened to match first.
    if (!args.dryRun) {
      const found = await Lead.findOne({ legacy_id: row.lead_id }).select("_id").lean();
      if (found) doc.lead = found._id;
    }
  }
  if (!args.dryRun) {
    await Transaction.findOneAndUpdate(
      { checkout_session_id: row.checkout_session_id },
      { $set: doc },
      { upsert: true, setDefaultsOnInsert: true, timestamps: false },
    );
  }
  note("transactions", 1);
}

// --- Phase 5: admin users --------------------------------------------------
// Django hashed passwords with PBKDF2-SHA256; this stack uses bcrypt. The two
// are not convertible, so the hash is deliberately NOT carried across. Users
// are created without a usable password and must be re-issued one via
// createAdmin.js. TOTP devices are dropped for the same reason: django_otp's
// secrets are usable, but silently re-enrolling a second factor from migrated
// state is worse than forcing a fresh, verified enrolment.
console.log(`\n${label} phase 5: admin users`);

const legacyUsers = rows(
  "SELECT id, username, email, is_superuser, is_staff, is_active, last_login FROM auth_user ORDER BY id",
);

// username -> ObjectId, used below by the audit log (Django stored only user_id).
const userIdByUsername = new Map();

for (const row of legacyUsers) {
  if (args.dryRun) {
    console.log(`${label}   user "${row.username}" -> needs a new password + 2FA enrolment`);
    note("users", 1);
    continue;
  }

  let existing = await User.findOne({ username: row.username }).select("_id");
  if (existing) {
    console.log(`${label}   user "${row.username}" already exists — left untouched`);
  } else {
    // An unusable placeholder hash: bcrypt of two random UUIDs that are then
    // discarded. The account cannot be logged into until createAdmin.js resets it.
    const placeholder = new User({
      username: row.username,
      email: row.email ?? "",
      is_superuser: bool(row.is_superuser),
      is_staff: bool(row.is_staff),
      is_active: bool(row.is_active),
      last_login: toDate(row.last_login),
    });
    await placeholder.setPassword(crypto.randomUUID() + crypto.randomUUID());
    await placeholder.save();
    existing = placeholder;
    console.log(
      `${label}   user "${row.username}" created WITHOUT a usable password — ` +
        `run: node src/scripts/createAdmin.js --username ${row.username} --force`,
    );
  }
  userIdByUsername.set(row.username, existing._id);
  note("users", 1);
}

// --- Phase 6: audit log ----------------------------------------------------
// Runs last because AdminAuditLog.user is a required ObjectId ref, so the
// users it points at must already exist. Append-only: the pre-hooks reject
// updateOne/findOneAndUpdate, so entries are inserted only when absent rather
// than upserted. Django's table has no ip column and stores only user_id.
console.log(`\n${label} phase 6: audit log`);

const legacyUsernameById = new Map(
  rows("SELECT id, username FROM auth_user").map((u) => [u.id, u.username]),
);

for (const row of rows("SELECT * FROM accounts_adminauditlog ORDER BY id")) {
  const actionTime = toDate(row.action_time);
  const username = legacyUsernameById.get(row.user_id) ?? "";

  if (!args.dryRun) {
    const userId = userIdByUsername.get(username);
    if (!userId) {
      throw new Error(
        `audit log id=${row.id}: no migrated user for user_id=${row.user_id} (${username})`,
      );
    }

    const exists = await AdminAuditLog.exists({
      action: row.action,
      object_repr: row.object_repr ?? "",
      action_time: actionTime,
    });
    if (!exists) {
      await AdminAuditLog.create({
        user: userId,
        username,
        action: row.action,
        object_repr: row.object_repr ?? "",
        changes: row.changes ?? "",
        ip: "",
        action_time: actionTime,
      });
    }
  }
  note("audit_log_entries", 1);
}

db.close();

// --- Summary ---------------------------------------------------------------
console.log(`\n${label} summary`);
for (const [key, count] of Object.entries(stats)) {
  console.log(`${label}   ${key.padEnd(20)} ${count}`);
}

if (args.dryRun) {
  console.log(`\n${label} nothing was written. Re-run without --dry-run to apply.`);
} else {
  const counts = await Promise.all([
    Service.countDocuments(),
    PortfolioItem.countDocuments(),
    CaseStudy.countDocuments(),
    Lead.countDocuments(),
    User.countDocuments(),
  ]);
  console.log(
    `\n${label} mongo now holds: services=${counts[0]} portfolio=${counts[1]} ` +
      `case_studies=${counts[2]} leads=${counts[3]} users=${counts[4]}`,
  );
  console.log(`${label} done. The SQLite file was opened read-only and is unchanged.`);
}

await mongoose.disconnect();
process.exit(0);
