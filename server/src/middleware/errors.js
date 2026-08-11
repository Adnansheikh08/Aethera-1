import { logger } from "../utils/logger.js";
import { config } from "../config/index.js";

/** Error carrying an HTTP status, thrown by the service layer. */
export class ApiError extends Error {
  constructor(status, message, details = null) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

/** Wraps an async route handler so rejections reach the error middleware. */
export function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

export function notFound(req, res) {
  res.status(404).json({ error: "Not found", path: req.originalUrl });
}

// eslint-disable-next-line no-unused-vars -- Express identifies the error handler by arity
export function errorHandler(err, req, res, _next) {
  const status = err.status || err.statusCode || 500;

  if (status >= 500) {
    logger.error({ err: err.message, stack: err.stack, path: req.originalUrl }, "Unhandled error");
  } else {
    logger.warn({ err: err.message, path: req.originalUrl }, "Request rejected");
  }

  const body = { error: status >= 500 && config.isProd ? "Internal server error" : err.message };
  if (err.details) body.details = err.details;
  // Stack traces are development-only; leaking them in production is how
  // internal paths and dependency versions end up in an attacker's notes.
  if (!config.isProd && status >= 500) body.stack = err.stack;

  res.status(status).json(body);
}
