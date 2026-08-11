import mongoose from "mongoose";

import { baseSchemaOptions } from "./base.js";

/**
 * Ported from apps/leads/models.py DataErasureRequest.
 * Compliance record for GDPR / India DPDP right-to-erasure requests.
 */
export const ERASURE_STATUS_CHOICES = ["PENDING", "COMPLETED", "FAILED"];

const dataErasureRequestSchema = new mongoose.Schema(
  {
    email_hash: {
      type: String,
      required: true,
      unique: true,
      index: true,
      maxlength: 64,
    },
    status: {
      type: String,
      enum: ERASURE_STATUS_CHOICES,
      default: "PENDING",
      index: true,
    },
    completed_at: { type: Date, default: null },
  },
  baseSchemaOptions,
);

export const DataErasureRequest = mongoose.model(
  "DataErasureRequest",
  dataErasureRequestSchema,
);
