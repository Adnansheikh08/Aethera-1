import { Lead } from "../models/Lead.js";
import { DataErasureRequest } from "../models/DataErasureRequest.js";
import { encrypt, decrypt, getEmailHash } from "../utils/crypto.js";
import { logger } from "../utils/logger.js";

/**
 * Ported from apps/leads/services.py.
 * PII is encrypted before it ever reaches the database; the peppered email
 * hash is the only searchable representation of a client's identity.
 */
export async function createLead({ name, email, phone, service_type, additional_info = "" }) {
  const lead = await Lead.create({
    encrypted_name: encrypt(name),
    encrypted_email: encrypt(email),
    encrypted_phone: encrypt(phone),
    email_hash: getEmailHash(email),
    service_type,
    additional_info,
  });

  // Note the absence of PII in this log line — deliberate, and reinforced by
  // the scrubbing configured in utils/logger.js.
  logger.info({ lead_id: lead.id, service_type }, "Lead successfully ingested");
  return lead;
}

/**
 * Ported from process_data_erasure(). GDPR / India DPDP right to erasure:
 * scrub the PII columns in place and stamp a compliance record.
 */
export async function processDataErasure(email) {
  const email_hash = getEmailHash(email);

  const leads = await Lead.find({ email_hash });
  if (leads.length === 0) {
    logger.warn({ email_hash }, "Erasure requested for email hash that does not exist");
    return false;
  }

  await Lead.updateMany(
    { email_hash },
    {
      $set: {
        encrypted_name: "[DELETED]",
        encrypted_email: "[DELETED]",
        encrypted_phone: "[DELETED]",
        additional_info: "[PII DELETED PER CLIENT REQUEST]",
        status: "CANCELLED",
      },
    },
  );

  await DataErasureRequest.findOneAndUpdate(
    { email_hash },
    { $set: { status: "COMPLETED", completed_at: new Date() } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  logger.warn({ email_hash, scrubbed: leads.length }, "Client PII successfully purged from database");
  return true;
}

/**
 * Decrypts a lead for admin display. Kept separate from the model so that
 * plaintext PII only materialises where a handler asks for it explicitly.
 */
export function decryptLead(lead) {
  const doc = typeof lead.toObject === "function" ? lead.toObject() : lead;
  return {
    id: doc.id || doc._id?.toString(),
    name: decrypt(doc.encrypted_name),
    email: decrypt(doc.encrypted_email),
    phone: decrypt(doc.encrypted_phone),
    service_type: doc.service_type,
    status: doc.status,
    additional_info: doc.additional_info,
    created_at: doc.created_at,
    updated_at: doc.updated_at,
  };
}

export async function listLeads({ status, limit = 50, skip = 0 } = {}) {
  const filter = status ? { status } : {};
  const [items, total] = await Promise.all([
    Lead.find(filter).sort({ created_at: -1 }).skip(skip).limit(Math.min(limit, 200)),
    Lead.countDocuments(filter),
  ]);
  return { items: items.map(decryptLead), total };
}
