import crypto from "node:crypto";

import { config } from "../config/index.js";
import { Lead } from "../models/Lead.js";
import { Transaction } from "../models/Transaction.js";
import { ApiError } from "../middleware/errors.js";
import { safeCompare } from "../utils/crypto.js";
import { logger } from "../utils/logger.js";

/**
 * Ported from apps/payments/views.py.
 *
 * Two defects in the Django original are fixed here rather than reproduced;
 * both are called out in the migration notes:
 *
 *  1. razorpay_webhook() mutated tx.status but never called tx.save(), so
 *     captured Razorpay payments were silently never persisted.
 *  2. stripe_webhook() only checked that a signature header was *present*,
 *     never that it was valid — any caller could mark a transaction paid.
 */

const BASELINE_AMOUNT = "5000.00"; // $5,000 baseline architecture audit
const BASELINE_CURRENCY = "USD";

export async function initiateStripeCheckout({ leadId }) {
  if (!leadId) throw new ApiError(400, "Missing lead identifier");

  const lead = await Lead.findById(leadId).catch(() => null);
  if (!lead) throw new ApiError(404, "Lead not found");

  // The original derived the id from md5(lead.id), which collides for repeat
  // checkouts on the same lead and would trip the unique index. A random
  // suffix keeps ids unique per attempt.
  const suffix = crypto.randomBytes(6).toString("hex");
  const checkoutSessionId = `cs_stripe_${suffix}`;

  const tx = await Transaction.create({
    lead: lead._id,
    checkout_session_id: checkoutSessionId,
    payment_gateway: "STRIPE",
    amount: BASELINE_AMOUNT,
    currency: BASELINE_CURRENCY,
    status: "PENDING",
  });

  logger.info({ tx_id: tx.id, session_id: checkoutSessionId }, "Stripe checkout initiated");

  // Mock URL, as in the Django version. Swapping in the real Stripe SDK means
  // replacing these two lines with a session create call.
  return {
    status: "checkout_initiated",
    url: `https://checkout.stripe.com/pay/${checkoutSessionId}`,
    session_id: checkoutSessionId,
  };
}

/**
 * Verifies a Stripe signature header (t=<ts>,v1=<hmac>) per Stripe's scheme:
 * HMAC-SHA256 over "<timestamp>.<raw body>" using the webhook secret.
 */
export function verifyStripeSignature({ rawBody, signatureHeader, toleranceSeconds = 300 }) {
  const secret = config.payments.stripeWebhookSecret;
  if (!secret) {
    throw new ApiError(500, "Stripe webhook secret is not configured");
  }
  if (!signatureHeader) {
    logger.error("Missing Stripe webhook signature header");
    throw new ApiError(400, "Signature Verification Failed");
  }

  const parts = String(signatureHeader)
    .split(",")
    .map((p) => p.split("="))
    .reduce((acc, [k, v]) => {
      if (k === "v1") (acc.v1 ||= []).push(v);
      else acc[k] = v;
      return acc;
    }, {});

  if (!parts.t || !parts.v1?.length) {
    throw new ApiError(400, "Malformed Stripe signature header");
  }

  const timestamp = Number(parts.t);
  if (!Number.isFinite(timestamp)) {
    throw new ApiError(400, "Malformed Stripe signature timestamp");
  }

  // Replay window. Without this a captured payload stays valid forever.
  const ageSeconds = Math.abs(Math.floor(Date.now() / 1000) - timestamp);
  if (ageSeconds > toleranceSeconds) {
    logger.error({ age_seconds: ageSeconds }, "Stripe webhook timestamp outside tolerance");
    throw new ApiError(400, "Signature timestamp outside tolerance");
  }

  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${parts.t}.${rawBody.toString("utf8")}`, "utf8")
    .digest("hex");

  const matched = parts.v1.some((candidate) => safeCompare(expected, candidate));
  if (!matched) {
    logger.error("Stripe webhook signature mismatch detected");
    throw new ApiError(403, "Forbidden: Signature Mismatch");
  }

  return true;
}

export async function handleStripeWebhook({ rawBody, signatureHeader }) {
  verifyStripeSignature({ rawBody, signatureHeader });

  let event;
  try {
    event = JSON.parse(rawBody.toString("utf8"));
  } catch {
    throw new ApiError(400, "Malformed webhook payload");
  }

  if (event.type === "checkout.session.completed") {
    const sessionId = event.data?.object?.id;

    const tx = await Transaction.findOneAndUpdate(
      { checkout_session_id: sessionId },
      { $set: { status: "COMPLETED" } },
      { new: true },
    );

    if (!tx) {
      logger.error({ session_id: sessionId }, "Transaction not found for completed Stripe session");
      throw new ApiError(404, "Transaction Not Found");
    }

    logger.info({ session_id: sessionId }, "Stripe transaction marked COMPLETED via webhook");
  }

  return { received: true };
}

/**
 * Ported from razorpay_webhook(). HMAC-SHA256 over the raw body, compared in
 * constant time — the one part of the original that was already correct.
 */
export async function handleRazorpayWebhook({ rawBody, signatureHeader }) {
  const secret = config.payments.razorpayWebhookSecret;
  if (!secret) {
    throw new ApiError(500, "Razorpay webhook secret is not configured");
  }
  if (!signatureHeader) {
    logger.error("Missing Razorpay signature header");
    throw new ApiError(400, "Signature Verification Failed");
  }

  const computed = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  if (!safeCompare(computed, signatureHeader)) {
    logger.error("Razorpay webhook signature mismatch detected");
    throw new ApiError(403, "Forbidden: Signature Mismatch");
  }

  let data;
  try {
    data = JSON.parse(rawBody.toString("utf8"));
  } catch {
    throw new ApiError(400, "Malformed webhook payload");
  }

  if (data.event === "payment.captured") {
    const sessionId = data.payload?.payment?.entity?.notes?.checkout_session_id || "";

    // findOneAndUpdate rather than mutate-without-save: this is the Django bug.
    const tx = await Transaction.findOneAndUpdate(
      { checkout_session_id: sessionId },
      { $set: { status: "COMPLETED" } },
      { new: true },
    );

    if (!tx) {
      logger.error({ session_id: sessionId }, "Transaction not found for captured Razorpay payment");
      throw new ApiError(404, "Transaction Not Found");
    }

    logger.info({ session_id: sessionId }, "Razorpay transaction marked COMPLETED via webhook");
  }

  return { received: true };
}
