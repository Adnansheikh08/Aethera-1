import crypto from "node:crypto";

/**
 * Minimal read-only Fernet decryptor.
 *
 * The Django app encrypted PII with cryptography.MultiFernet. This module
 * exists solely so the one-time SQLite -> MongoDB migration can read those
 * rows; nothing in the running application should import it.
 *
 * Fernet token layout (spec):
 *   version (1 byte, 0x80) | timestamp (8) | IV (16) | ciphertext (n) | HMAC-SHA256 (32)
 * Key layout: 32 bytes urlsafe-base64 == signing key (16) || encryption key (16)
 * Cipher: AES-128-CBC with PKCS7 padding.
 */

function b64urlToBuffer(value) {
  const normalised = String(value).replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(normalised, "base64");
}

function splitKey(fernetKey) {
  const raw = b64urlToBuffer(fernetKey);
  if (raw.length !== 32) {
    throw new Error(`Invalid Fernet key length: ${raw.length} bytes (expected 32)`);
  }
  return {
    signingKey: raw.subarray(0, 16),
    encryptionKey: raw.subarray(16, 32),
  };
}

/**
 * Rebuilds the fallback Fernet key Django derived when FIELD_ENCRYPTION_KEY
 * was unset: base64.urlsafe_b64encode(sha256(SECRET_KEY).digest())
 */
export function deriveLegacyFallbackKey(secretKey) {
  const digest = crypto.createHash("sha256").update(secretKey, "utf8").digest();
  // Django used base64.urlsafe_b64encode, which keeps '=' padding. Node's
  // "base64url" strips it, so pad back to a multiple of 4 to match byte-for-byte.
  const unpadded = digest.toString("base64url");
  return unpadded + "=".repeat((4 - (unpadded.length % 4)) % 4);
}

function stripPkcs7(buf) {
  if (buf.length === 0) return buf;
  const pad = buf[buf.length - 1];
  if (pad < 1 || pad > 16 || pad > buf.length) {
    throw new Error("Invalid PKCS7 padding");
  }
  for (let i = buf.length - pad; i < buf.length; i += 1) {
    if (buf[i] !== pad) throw new Error("Invalid PKCS7 padding bytes");
  }
  return buf.subarray(0, buf.length - pad);
}

/** Decrypts one Fernet token with one key. Throws on HMAC or padding failure. */
export function fernetDecrypt(token, fernetKey) {
  const { signingKey, encryptionKey } = splitKey(fernetKey);
  const raw = b64urlToBuffer(token);

  if (raw.length < 57) {
    throw new Error("Fernet token too short");
  }
  if (raw[0] !== 0x80) {
    throw new Error(`Unsupported Fernet version byte: 0x${raw[0].toString(16)}`);
  }

  const signed = raw.subarray(0, raw.length - 32);
  const providedHmac = raw.subarray(raw.length - 32);

  const expectedHmac = crypto.createHmac("sha256", signingKey).update(signed).digest();
  if (!crypto.timingSafeEqual(expectedHmac, providedHmac)) {
    throw new Error("Fernet HMAC verification failed");
  }

  const iv = raw.subarray(9, 25);
  const ciphertext = raw.subarray(25, raw.length - 32);

  const decipher = crypto.createDecipheriv("aes-128-cbc", encryptionKey, iv);
  decipher.setAutoPadding(false);
  const padded = Buffer.concat([decipher.update(ciphertext), decipher.final()]);

  return stripPkcs7(padded).toString("utf8");
}

/** MultiFernet behaviour: try each key in order, return the first success. */
export function multiFernetDecrypt(token, fernetKeys) {
  let lastError = null;
  for (const key of fernetKeys) {
    try {
      return fernetDecrypt(token, key);
    } catch (err) {
      lastError = err;
    }
  }
  throw new Error(`Legacy Fernet decryption failed with all keys: ${lastError?.message}`);
}
