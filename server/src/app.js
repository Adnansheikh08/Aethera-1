import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import compression from "compression";

import { config } from "./config/index.js";
import { logger } from "./utils/logger.js";

import { ipBan } from "./middleware/ipBan.js";
import { csp } from "./middleware/csp.js";
import { rateLimit } from "./middleware/rateLimit.js";
import { waf } from "./middleware/waf.js";
import { notFound, errorHandler } from "./middleware/errors.js";

import publicRoutes from "./routes/public.js";
import authRoutes from "./routes/auth.js";
import adminRoutes from "./routes/admin.js";
import paymentRoutes from "./routes/payments.js";

/**
 * Replaces config/settings/base.py MIDDLEWARE + config/urls.py.
 *
 * The middleware order below is the Django order, and the order matters:
 * banned IPs are rejected before anything reads their payload, the rate
 * limiter runs before the body is parsed so a flood of 1MB bodies costs us
 * nothing, and the WAF runs after parsing because it needs the decoded JSON.
 */
export function createApp() {
  const app = express();

  // getClientIp() parses X-Forwarded-For itself, but req.protocol (used to
  // build absolute URLs in sitemap.xml) needs this to see X-Forwarded-Proto.
  app.set("trust proxy", config.isProd ? 1 : false);
  app.disable("x-powered-by");

  // helmet's own CSP is disabled: csp.js emits the nonce-based policy ported
  // from apps/core/middleware/csp.py, and two CSP headers would conflict.
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
    }),
  );

  // Django and the SPA shared an origin; Vite does not, so credentialed CORS
  // is required for the httpOnly refresh cookie to survive /api/auth/refresh.
  app.use(
    cors({
      origin: config.clientOrigin,
      credentials: true,
      exposedHeaders: ["X-CSP-Nonce"],
    }),
  );

  app.use(cookieParser());
  app.use(compression());

  app.use(ipBan);
  app.use(csp);
  app.use(rateLimit);

  app.use(
    express.json({
      limit: "1mb",
      // Stripe and Razorpay sign the exact bytes on the wire. Stashing them
      // here is the only way to both parse the JSON and verify the HMAC;
      // re-serialising the parsed object would reorder keys and break it.
      verify: (req, _res, buf) => {
        req.rawBody = buf;
      },
    }),
  );
  app.use(express.urlencoded({ extended: false, limit: "1mb" }));

  app.use(waf);

  app.use((req, res, next) => {
    const startedAt = process.hrtime.bigint();
    res.on("finish", () => {
      const ms = Number(process.hrtime.bigint() - startedAt) / 1e6;
      logger.info(
        { method: req.method, path: req.originalUrl, status: res.statusCode, ms: Math.round(ms) },
        "request",
      );
    });
    next();
  });

  app.use("/api", publicRoutes);
  app.use("/api/auth", authRoutes);
  app.use("/api/payments", paymentRoutes);
  // Kept behind the obfuscated path the Django admin used, so scanners that
  // probe /api/admin find nothing.
  app.use(`/api/${config.adminUrlPath}`, adminRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
