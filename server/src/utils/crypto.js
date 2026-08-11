import crypto from "node:crypto";

import { config } from "../config/index.js";

/**
 * Field-level PII encryption.
 *
 * Ported from apps/leads/services.py (PiiEncryptionEngine, which wrapped
 * cryptography.MultiFernet). Two behaviours are preserved deliberately:
 *
 *  1. Key rotation — the first key encrypts, every key is tried on decrypt.
 *  2. SECRET_KEY fallback — when no FIELD_ENCRYPTION_KEY is configured, a
 *     deterministic key is derived from SECRET_KEY, exactly as Django did.
 *
 * The wire format is new (AES-256-GCM rather than Fernet's AES-128-CBC+HMAC),
 * so ciphertext is tagged with a version prefix to keep the two
 * distinguishable. Legacy Fernet tokens are readable via legacyFernet.js
 * during the one-time migration.
 */

const VERSION_PREFIX = "v2:";
const IV_BYTES = 12; // GCM standard nonce length
const TAG_BYTES = 16;

function deriveFallbackKey() {
  // Django: hashlib.sha256(SECRET_KEY).digest() -> 32 raw bytes
  return crypto.createHash("sha256").update(config.secretKey, "utf8").digest();
}

function loadKeys() {
  const configured = config.fieldEncryptionKeys
    .map((raw) => {
      // Accept base64 (standard or urlsafe) and hex.
      const normalised = raw.replace(/-/g, "+").replace(/_/g, "/");
      let buf;
      if (/^[0-9a-fA-F]{64}$/.test(raw)) {
        buf = Buffer.from(raw, "hex");
      } else {
        buf = Buffer.from(normalised, "base64");
      }
      // A Fernet key is 32 bytes of base64 too, so length is the only check
      // that matters here: AES-256 needs exactly 32 bytes.
      return buf.length === 32 ? buf : null;
    })
    .filter(Boolean);

  if (configured.length > 0) {
    return configured;
  }
  return [deriveFallbackKey()];
}

let cachedKeys = null;

function keys() {
  if (!cachedKeys) {
    cachedKeys = loadKeys();
  }
  return cachedKeys;
}

/** Reset the key cache. Used by tests and by the migration script. */
export function resetKeyCache() {
  cachedKeys = null;
}

/**
 * Encrypts a string with the primary key. Empty input returns an empty
 * string, matching the Django engine's behaviour.
 */
export function encrypt(plaintext) {
  if (!plaintext) return "";

  const key = keys()[0];
  const iv = crypto.randomBytes(IV_BYTES);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([
    cipher.update(String(plaintext), "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  return VERSION_PREFIX + Buffer.concat([iv, tag, ciphertext]).toString("base64");
}

/**
 * Decrypts a ciphertext, trying every configured key in order so that key
 * rotation does not orphan existing rows.
 */
export function decrypt(ciphertext) {
  if (!ciphertext) return "";

  // Scrubbed / sentinel values written by the erasure flow are returned as-is
  // rather than throwing — they are not ciphertext.
  if (!ciphertext.startsWith(VERSION_PREFIX)) {
    return ciphertext;
  }

  const raw = Buffer.from(ciphertext.slice(VERSION_PREFIX.length), "base64");
  const iv = raw.subarray(0, IV_BYTES);
  const tag = raw.subarray(IV_BYTES, IV_BYTES + TAG_BYTES);
  const body = raw.subarray(IV_BYTES + TAG_BYTES);

  let lastError = null;
  for (const key of keys()) {
    try {
      const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
      decipher.setAuthTag(tag);
      return Buffer.concat([decipher.update(body), decipher.final()]).toString("utf8");
    } catch (err) {
      lastError = err;
    }
  }
  throw new Error(`PII decryption failed with all configured keys: ${lastError?.message}`);
}

/**
 * Ported from apps/leads/services.py get_email_hash().
 * SHA-256 over "<lowercased email>:<SECRET_KEY>" — the pepper and the exact
 * layout must not change or legacy erasure lookups stop matching.
 */
export function getEmailHash(email) {
  const cleaned = String(email || "").trim().toLowerCase();
  return crypto
    .createHash("sha256")
    .update(`${cleaned}:${config.secretKey}`, "utf8")
    .digest("hex");
}

/** Constant-time string comparison for webhook signature checks. */
export function safeCompare(a, b) {
  const bufA = Buffer.from(String(a), "utf8");
  const bufB = Buffer.from(String(b), "utf8");
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}
