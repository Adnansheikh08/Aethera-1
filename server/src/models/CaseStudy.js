import mongoose from "mongoose";

import { baseSchemaOptions } from "./base.js";

/**
 * Ported from apps/agency/models.py CaseStudy.
 */
const caseStudySchema = new mongoose.Schema(
  {
    service: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Service",
      required: true,
      index: true,
    },
    client_name: { type: String, required: true, maxlength: 150 },
    slug: { type: String, required: true, unique: true, index: true, maxlength: 150 },
    challenge: { type: String, required: true },
    result: { type: String, required: true },
    // e.g. "+140% speed optimization / A+ WAF rating"
    metrics: { type: String, required: true, maxlength: 200 },
    is_published: { type: Boolean, default: true, index: true },
  },
  baseSchemaOptions,
);

export const CaseStudy = mongoose.model("CaseStudy", caseStudySchema);
