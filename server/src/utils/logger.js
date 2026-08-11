import pino from "pino";

import { config } from "../config/index.js";

/**
 * Ported from apps/core/logging.py (ScrubbedJsonFormatter).
 * Redacts credentials, secrets, tokens and PII from structured log output.
 */
const SCRUB_KEYS = [
  "password",
  "secret",
  "token",
  "key",
  "authorization",
  "email",
  "phone",
  "name",
  "credit_card",
  "cvv",
];

// pino redaction paths: scrub at top level, one level deep, and in common wrappers.
const redactPaths = SCRUB_KEYS.flatMap((k) => [
  k,
  `*.${k}`,
  `req.body.${k}`,
  `req.headers.${k}`,
]);

export const logger = pino({
  level: process.env.LOG_LEVEL || (config.isProd ? "info" : "debug"),
  redact: {
    paths: redactPaths,
    censor: "[SCRUBBED]",
  },
  formatters: {
    level: (label) => ({ level: label.toUpperCase() }),
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  transport: config.isProd
    ? undefined
    : {
        target: "pino/file",
        options: { destination: 1 },
      },
});
