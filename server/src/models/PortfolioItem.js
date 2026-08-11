import mongoose from "mongoose";

import { baseSchemaOptions } from "./base.js";

/**
 * Ported from apps/agency/models.py PortfolioItem.
 *
 * The Django FK used on_delete=PROTECT. Mongo has no referential integrity, so
 * that guarantee is enforced in the admin delete handler instead — see
 * services/agencyService.js deleteService().
 */
const portfolioItemSchema = new mongoose.Schema(
  {
    service: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Service",
      required: true,
      index: true,
    },
    title: { type: String, required: true, maxlength: 200 },
    slug: { type: String, required: true, unique: true, index: true, maxlength: 200 },
    description: { type: String, required: true },
    project_url: { type: String, default: "", maxlength: 500 },
    is_published: { type: Boolean, default: true, index: true },
  },
  baseSchemaOptions,
);

export const PortfolioItem = mongoose.model("PortfolioItem", portfolioItemSchema);
