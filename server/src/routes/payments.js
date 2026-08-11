import express from "express";

import { asyncHandler } from "../middleware/errors.js";
import {
  initiateStripeCheckout,
  handleStripeWebhook,
  handleRazorpayWebhook,
} from "../services/paymentService.js";

const router = express.Router();

/** Ported from apps/payments/views.py initiate_stripe_checkout. */
router.post(
  "/stripe/checkout",
  asyncHandler(async (req, res) => {
    const leadId = req.body?.lead_id || req.query.lead_id;
    res.json(await initiateStripeCheckout({ leadId }));
  }),
);

/**
 * Webhook HMACs are computed over the exact bytes on the wire, so the parsed
 * body is useless here — re-serialising it would change key order and
 * whitespace and every signature would fail. req.rawBody is captured by the
 * express.json() verify hook in app.js. Django handed us request.body for
 * free; Express needs that hook.
 */
router.post(
  "/stripe/webhook",
  asyncHandler(async (req, res) => {
    const result = await handleStripeWebhook({
      rawBody: req.rawBody ?? Buffer.alloc(0),
      signatureHeader: req.headers["stripe-signature"],
    });
    res.json(result);
  }),
);

router.post(
  "/razorpay/webhook",
  asyncHandler(async (req, res) => {
    const result = await handleRazorpayWebhook({
      rawBody: req.rawBody ?? Buffer.alloc(0),
      signatureHeader: req.headers["x-razorpay-signature"],
    });
    res.json(result);
  }),
);

export default router;
