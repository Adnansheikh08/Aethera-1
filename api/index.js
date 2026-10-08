import mongoose from "mongoose";

import { createApp } from "../server/src/app.js";
import { connectDatabase } from "../server/src/config/database.js";

/**
 * Vercel serverless entry point for the whole Express API.
 *
 * This file exists to satisfy the Vercel Node runtime's contract: a function
 * module must export a handler as its **default** export. server/src/app.js
 * exports `createApp` as a named export and starts nothing, which is what
 * produced "Invalid export found in module ... The default export must be a
 * function or server" when Vercel was pointed at it directly.
 *
 * The app is built once at module scope. Vercel reuses a warm instance for
 * later invocations, so this does not re-run per request.
 */
const app = createApp();

/**
 * Cached connection promise, module-scoped.
 *
 * server/src/config/database.js.connectDatabase() connects unconditionally —
 * correct for the long-lived Docker process, wrong for a function that may be
 * invoked on a fresh instance for every request. Holding the promise here means
 * warm invocations reuse the pool instead of opening a new one, while the
 * connection still thaws cleanly on a cold start.
 *
 * A rejected attempt is not cached: leaving it in place would poison every
 * later request on that instance with the first failure.
 */
let connection;

function ensureDatabase() {
  if (mongoose.connection.readyState === 1) return Promise.resolve();
  if (!connection) {
    connection = connectDatabase().catch((err) => {
      connection = undefined;
      throw err;
    });
  }
  return connection;
}

/**
 * Root paths that must reach routes the app mounts under /api.
 *
 * Vercel rewrites select which function handles a request but hand that
 * function the *original* path, so a request to /robots.txt arrives here as
 * "/robots.txt" and would miss the router mounted at /api. Both of these are
 * required at the domain root — a crawler only ever looks there — while the
 * /api/... forms stay reachable for direct callers and for the Docker/nginx
 * deployment.
 */
const ROOT_ALIASES = new Map([
  ["/robots.txt", "/api/robots.txt"],
  ["/sitemap.xml", "/api/sitemap.xml"],
]);

/** Vercel Node runtime entry: (req, res), same contract as an http handler. */
export default async function handler(req, res) {
  await ensureDatabase();

  const [pathname, search] = req.url.split("?");
  const alias = ROOT_ALIASES.get(pathname);
  if (alias) req.url = search ? `${alias}?${search}` : alias;

  return app(req, res);
}
