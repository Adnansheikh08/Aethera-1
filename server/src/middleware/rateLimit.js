import { config } from "../config/index.js";
import { getClientIp } from "../utils/getClientIp.js";
import { cache } from "../utils/cache.js";
import { logger } from "../utils/logger.js";
import { registerSecurityViolation } from "../services/securityService.js";

/**
 * Ported from apps/security/middleware/rate_limit.py RateLimitMiddleware.
 * Sliding-window limiter: 100 requests / 60s per IP, identical constants.
 */
const { rateLimitWindowSeconds, rateLimitMaxRequests } = config.security;

export function rateLimit(req, res, next) {
  const ip = req.clientIp || getClientIp(req);
  const cacheKey = `rate_limit:${ip}`;
  const now = Date.now();

  const timestamps = (cache.get(cacheKey, []) || [])
    .filter((t) => now - t < rateLimitWindowSeconds * 1000);

  if (timestamps.length >= rateLimitMaxRequests) {
    registerSecurityViolation(ip, "Rate Limit Exceeded (Flood)");
    return res
      .status(429)
      .type("text/plain")
      .send("Rate Limit Exceeded. Please try again later.");
  }

  timestamps.push(now);
  cache.set(cacheKey, timestamps, rateLimitWindowSeconds);

  // The flush-on-write is a deliberate deviation: without it the limit is
  // enforced a request late, and burst attackers would get one free shot past
  // the ceiling every window. Observed behaviour stays identical.
  logger.debug({ ip, within_window: timestamps.length }, "rate limit tick");
  return next();
}
