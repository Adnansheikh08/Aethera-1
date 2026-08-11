import { config } from "../config/index.js";
import { cache } from "../utils/cache.js";
import { logger } from "../utils/logger.js";

/**
 * Ported from apps/security/services.py.
 * Tracks security violations per IP and locks the IP out once the threshold
 * is crossed. Limits and durations are unchanged from the Django version.
 */
const { violationLimit, banDurationSeconds } = config.security;

export function registerSecurityViolation(ip, reason) {
  const violationKey = `security_violations:${ip}`;
  const banKey = `banned_ip:${ip}`;

  try {
    const violations = (cache.get(violationKey, 0) || 0) + 1;
    cache.set(violationKey, violations, banDurationSeconds);

    logger.warn({ ip, reason, total_violations: violations }, "Security violation registered");

    if (violations >= violationLimit) {
      cache.set(banKey, true, banDurationSeconds);
      logger.error(
        { ip, reason: "Violation limit exceeded", ban_duration_seconds: banDurationSeconds },
        "IP Lockout Activated",
      );
      // A production deployment would fan this out to Slack/email here.
    }
  } catch (err) {
    logger.error({ ip, err: err.message }, "Failed to write security event to cache store");
  }
}

export function isIpBanned(ip) {
  try {
    return Boolean(cache.get(`banned_ip:${ip}`, false));
  } catch {
    // Django comment: fail closed to prevent bypassing the lockout.
    return true;
  }
}

/** Clears ban state for an IP. Exposed for the admin dashboard. */
export function clearIpBan(ip) {
  cache.delete(`banned_ip:${ip}`);
  cache.delete(`security_violations:${ip}`);
  logger.warn({ ip }, "IP ban manually cleared");
}
