/**
 * Resolves the real client IP.
 *
 * Ported from the identical block repeated in every Django middleware:
 *   ip = META["HTTP_X_FORWARDED_FOR"] or META["REMOTE_ADDR"]
 *   if "," in ip: ip = ip.split(",")[0].strip()
 *
 * Express must be started with `app.set("trust proxy", ...)` for req.ip to be
 * meaningful behind nginx; the header is read directly here to match the
 * original behaviour exactly.
 */
export function getClientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  let ip = "";

  if (forwarded) {
    ip = Array.isArray(forwarded) ? forwarded[0] : forwarded;
  } else {
    ip = req.socket?.remoteAddress || req.ip || "";
  }

  if (ip && ip.includes(",")) {
    ip = ip.split(",")[0].trim();
  }

  // Normalise IPv4-mapped IPv6 (::ffff:127.0.0.1) so ban keys stay stable.
  return ip.replace(/^::ffff:/, "");
}
