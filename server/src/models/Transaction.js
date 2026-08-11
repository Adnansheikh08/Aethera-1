import mongoose from "mongoose";

import { baseSchemaOptions } from "./base.js";

/**
 * Ported from apps/payments/models.py Transaction.
 *
 * amount was a DecimalField(max_digits=12, decimal_places=2). Mongoose
 * Decimal128 is used rather than Number so currency values stay exact —
 * a float would silently drift on sums.
 */
export const GATEWAY_CHOICES = ["STRIPE", "RAZORPAY"];
export const TX_STATUS_CHOICES = ["PENDING", "COMPLETED", "FAILED"];

const transactionSchema = new mongoose.Schema(
  {
    // Django used on_delete=SET_NULL, so the FK is nullable by design.
    lead: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lead",
      default: null,
      index: true,
    },
    checkout_session_id: {
      type: String,
      required: true,
      unique: true,
      index: true,
      maxlength: 255,
    },
    payment_gateway: { type: String, required: true, enum: GATEWAY_CHOICES },
    amount: {
      type: mongoose.Schema.Types.Decimal128,
      required: true,
      get: (v) => (v == null ? v : v.toString()),
    },
    currency: { type: String, default: "USD", maxlength: 10 },
    status: {
      type: String,
      enum: TX_STATUS_CHOICES,
      default: "PENDING",
      index: true,
    },
  },
  { ...baseSchemaOptions, toJSON: { ...baseSchemaOptions.toJSON, getters: true } },
);

export const Transaction = mongoose.model("Transaction", transactionSchema);
