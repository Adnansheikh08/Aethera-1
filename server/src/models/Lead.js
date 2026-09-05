import mongoose from "mongoose";

import { baseSchemaOptions } from "./base.js";

/**
 * Ported from apps/leads/models.py Lead.
 *
 * PII is stored encrypted (AES-256-GCM, see utils/crypto.js) and never
 * queried directly. email_hash is the indexed lookup key, matching the
 * original design so erasure requests still resolve after migration.
 */
export const STATUS_CHOICES = ["NEW", "CONTACTED", "COMPLETED", "CANCELLED"];

export const SERVICE_CHOICES = [
  "web-development",
  "mobile-app-development",
  "digital-advertising-campaigns",
  "video-photo-editing",
  "high-ctr-thumbnail-design",
  "on-location-vlog-shoots",
  "ui-ux-design",
  "software-testing",
  "odoo-erp-solutions",
];

/** Human labels, kept alongside the slugs as Django's choices tuples did. */
export const SERVICE_LABELS = {
  "web-development": "Web Development",
  "mobile-app-development": "Mobile App Development",
  "digital-advertising-campaigns": "Digital Advertising & Campaigns",
  "video-photo-editing": "Video & Photo Editing",
  "high-ctr-thumbnail-design": "High-CTR Thumbnail Design",
  "on-location-vlog-shoots": "On-Location Blog & Vlog Shoots",
  "ui-ux-design": "UI/UX Design",
  "software-testing": "Software Testing",
  "odoo-erp-solutions": "Odoo Implementation and Development",
};

export const STATUS_LABELS = {
  NEW: "New Inquiry",
  CONTACTED: "Client Contacted",
  COMPLETED: "Onboarded",
  CANCELLED: "Closed/Cancelled",
};

const leadSchema = new mongoose.Schema(
  {
    encrypted_name: { type: String, required: true },
    encrypted_email: { type: String, required: true },
    encrypted_phone: { type: String, required: true },

    // SHA-256(email + SECRET_KEY pepper) — indexed for lookups and erasures.
    // Deliberately NOT unique: one person may submit several enquiries, and the
    // Django schema indexed this column without a unique constraint too.
    email_hash: { type: String, required: true, index: true, maxlength: 64 },

    // The Django row id this document came from, set only by the one-time
    // SQLite import. It exists so re-running the migration updates a row
    // instead of collapsing repeat enquiries that share an email_hash.
    // `sparse` keeps it out of the index for leads created through the API.
    legacy_id: { type: Number, unique: true, sparse: true, select: false },

    service_type: { type: String, required: true, enum: SERVICE_CHOICES },
    status: {
      type: String,
      enum: STATUS_CHOICES,
      default: "NEW",
      index: true,
    },
    additional_info: { type: String, default: "" },
  },
  baseSchemaOptions,
);

export const Lead = mongoose.model("Lead", leadSchema);
