import mongoose from "mongoose";

import { baseSchemaOptions } from "./base.js";

/**
 * Ported from apps/agency/models.py Service.
 */
const serviceSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, maxlength: 150 },
    slug: { type: String, required: true, unique: true, index: true, maxlength: 150 },
    short_description: { type: String, required: true },
    description: { type: String, required: true },
    // Raw SVG XML payload rendered inline by the client.
    icon: { type: String, default: "" },
    is_active: { type: Boolean, default: true, index: true },
  },
  baseSchemaOptions,
);

export const Service = mongoose.model("Service", serviceSchema);
