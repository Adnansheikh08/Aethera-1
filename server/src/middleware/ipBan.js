import { isIpBanned } from "../services/securityService.js";
import { getClientIp } from "../utils/getClientIp.js";

/**
 * Ported from apps/security/middleware/ip_ban.py IpBanMiddleware.
 * Blocks blacklisted IPs before any routing or WAF work happens, so this must
 * stay first in the middleware chain — same position it held in Django.
 */
export function ipBan(req, res, next) {
  const ip = getClientIp(req);

  if (isIpBanned(ip)) {
    return res
      .status(403)
      .type("text/plain")
      .send("Access Denied: Your IP address is locked due to security policy violations.");
  }

  req.clientIp = ip;
  return next();
}
