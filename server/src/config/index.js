import dotenv from "dotenv";

dotenv.config();

/**
 * Centralised configuration. Mirrors the Django settings split
 * (base / development / production) via NODE_ENV.
 */
const env = process.env.NODE_ENV || "development";
const isProd = env === "production";

function required(name, fallback) {
  const value = process.env[name] || fallback;
  if (!value && isProd) {
    throw new Error(`Missing required environment variable in production: ${name}`);
  }
  return value;
}

export const config = {
  env,
  isProd,
  port: Number(process.env.PORT || 5000),

  mongoUri: process.env.MONGO_URI || "mongodb://127.0.0.1:27017/aethera",

  // Ported from Django SECRET_KEY. Used as the pepper for email hashing so
  // legacy hashes stay reproducible after the migration.
  secretKey: required("SECRET_KEY", "dev-secret-key-324890234890234890234890234890234890"),

  // AES-256-GCM key(s), base64. First key encrypts; all keys are tried on
  // decrypt, which is how MultiFernet key rotation worked in Django.
  fieldEncryptionKeys: (process.env.FIELD_ENCRYPTION_KEY || "")
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean),

  // The old Django Fernet key(s). Read only by scripts/importLegacy.js to
  // decrypt PII once during the migration — nothing in the request path
  // touches these, and they can be dropped from .env after the import.
  legacyFernetKeys: (process.env.LEGACY_FERNET_KEY || "")
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean),

  jwt: {
    accessSecret: required("JWT_ACCESS_SECRET", "dev-access-secret-change-me"),
    refreshSecret: required("JWT_REFRESH_SECRET", "dev-refresh-secret-change-me"),
    accessTtl: process.env.JWT_ACCESS_TTL || "15m",
    refreshTtl: process.env.JWT_REFRESH_TTL || "7d",
  },

  clientOrigin: process.env.CLIENT_ORIGIN || "http://localhost:5173",

  payments: {
    stripeSecretKey: process.env.STRIPE_SECRET_KEY || "",
    stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY || "",
    stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET || "",
    razorpayKeyId: process.env.RAZORPAY_KEY_ID || "",
    razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET || "",
    razorpayWebhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || "",
  },

  security: {
    // Ported verbatim from apps/security/services.py
    violationLimit: 3,
    banDurationSeconds: 86400,
    // Ported from apps/security/middleware/rate_limit.py
    rateLimitWindowSeconds: 60,
    rateLimitMaxRequests: 100,
  },

  // Ported from apps/accounts — obfuscated admin path
  adminUrlPath: process.env.ADMIN_URL_PATH || "portal-admin-8f2e9a7c",

  // The one email/password pair that always logs in with superuser rights
  // (see services/authService.js). Any other email self-provisions a basic
  // admin account instead — the tradeoff the product asked for over having
  // no self-serve admin signup at all.
  superAdminEmail: (process.env.SUPER_ADMIN_EMAIL || process.env.ADMIN_EMAIL || "")
    .trim()
    .toLowerCase(),
  superAdminPassword: process.env.SUPER_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD || "",

  // SMTP transport for admin invite emails (services/mailer.js). Left blank in
  // development: the invite link just gets logged/returned instead of mailed.
  smtp: {
    host: process.env.SMTP_HOST || "",
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    user: process.env.SMTP_USER || "",
    pass: process.env.SMTP_PASS || "",
    from: process.env.SMTP_FROM || "Aethera <no-reply@aethera.dev>",
  },
};
