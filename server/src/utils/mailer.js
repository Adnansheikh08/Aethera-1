import nodemailer from "nodemailer";

import { config } from "../config/index.js";
import { logger } from "./logger.js";

let transporter = null;

function getTransporter() {
  if (!config.smtp.host) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.secure,
      auth: config.smtp.user ? { user: config.smtp.user, pass: config.smtp.pass } : undefined,
    });
  }
  return transporter;
}

/**
 * Best-effort mail send. Without SMTP_HOST configured (e.g. local dev) this
 * just logs instead of throwing, so invite creation never fails on a missing
 * mail provider — the caller still gets the link back to share manually.
 */
export async function sendMail({ to, subject, text, html }) {
  const transport = getTransporter();
  if (!transport) {
    logger.warn({ to, subject }, "SMTP not configured — email not sent");
    return { sent: false };
  }

  try {
    await transport.sendMail({ from: config.smtp.from, to, subject, text, html });
    logger.info({ to, subject }, "Email sent");
    return { sent: true };
  } catch (err) {
    // Mail delivery must not break the operation that triggered it (e.g. an
    // admin invite is still valid even if the notification email bounces).
    logger.error({ err: err.message, to, subject }, "Failed to send email");
    return { sent: false };
  }
}
