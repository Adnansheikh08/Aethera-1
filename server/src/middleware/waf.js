import { registerSecurityViolation } from "../services/securityService.js";
import { getClientIp } from "../utils/getClientIp.js";

/**
 * Ported from apps/security/middleware/waf.py WafMiddleware.
 *
 * Patterns are carried over verbatim. In Django this inspected request.GET
 * and request.POST; here it walks query, body and route params, since an API
 * takes JSON bodies that the original form-encoded checks would have missed.
 */
const SQL_INJECTION =
  /UNION\s+ALL\s+SELECT|SELECT\s+.*\s+FROM|INSERT\s+INTO|UPDATE\s+.*\s+SET|DELETE\s+FROM/i;
const PATH_TRAVERSAL = /\.\.\/|\.\.\\/i;
const COMMAND_INJECTION = /;\s*(cat|ls|pwd|whoami|id|uname|sh|bash|cmd|powershell)\b/i;

function hasMaliciousPayload(value) {
  if (typeof value !== "string") return false;
  return (
    SQL_INJECTION.test(value) ||
    PATH_TRAVERSAL.test(value) ||
    COMMAND_INJECTION.test(value)
  );
}

/**
 * Recursively scans nested JSON. The Django version only saw flat form values;
 * a JSON API can nest a payload arbitrarily deep, so a flat scan would be a
 * hole in the port rather than a faithful copy of it.
 */
function scan(value, depth = 0) {
  if (depth > 8) return false;
  if (typeof value === "string") return hasMaliciousPayload(value);
  if (Array.isArray(value)) return value.some((v) => scan(v, depth + 1));
  if (value && typeof value === "object") {
    return Object.values(value).some((v) => scan(v, depth + 1));
  }
  return false;
}

export function waf(req, res, next) {
  const ip = req.clientIp || getClientIp(req);

  if (scan(req.query)) {
    registerSecurityViolation(ip, "WAF SQL/Shell/Traversal Injection (GET)");
    return res.status(403).type("text/plain").send("Security Violation Detected.");
  }

  if (scan(req.body)) {
    registerSecurityViolation(ip, "WAF SQL/Shell/Traversal Injection (POST)");
    return res.status(403).type("text/plain").send("Security Violation Detected.");
  }

  if (scan(req.params)) {
    registerSecurityViolation(ip, "WAF SQL/Shell/Traversal Injection (PARAMS)");
    return res.status(403).type("text/plain").send("Security Violation Detected.");
  }

  return next();
}
