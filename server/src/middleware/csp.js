import crypto from "node:crypto";

/**
 * Ported from apps/core/middleware/csp.py CspMiddleware.
 *
 * Django generated a 32-byte urlsafe nonce per request and served it through
 * a template context variable. An SPA has no server-rendered templates, so
 * the nonce is minted here and handed back to the frontend on a success
 * response via the X-CSP-Nonce header; the client applies it to any dynamic
 * scripts, and this middleware pins the header that enforces it.
 */
const CSP_POLICIES = (nonce) => [
  "default-src 'self'",
  `script-src 'self' 'nonce-${nonce}'`,
  `style-src 'self' 'nonce-${nonce}' https://fonts.googleapis.com`,
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data: https:",
  "connect-src 'self'",
  "object-src 'none'",
  "media-src 'self'",
  "base-uri 'self'",
  "frame-ancestors 'none'",
  "form-action 'self'",
];

export function csp(req, res, next) {
  const nonce = crypto.randomBytes(24).toString("base64url");
  res.locals.cspNonce = nonce;

  res.setHeader("Content-Security-Policy", CSP_POLICIES(nonce).join("; "));

  const originalJson = res.json.bind(res);
  res.json = (body) => {
    // Attach the nonce to every JSON response so the SPA can apply it to
    // scripts it injects without a separate round-trip.
    res.setHeader("X-CSP-Nonce", nonce);
    return originalJson(body);
  };

  return next();
}
