import { createApp } from "./app.js";
import { config } from "./config/index.js";
import { connectDatabase, disconnectDatabase } from "./config/database.js";
import { logger } from "./utils/logger.js";
import { verifyMailConnection } from "./utils/mailer.js";

/** Entrypoint. Replaces manage.py runserver / the WSGI application. */
async function main() {
  await connectDatabase();

  const app = createApp();
  const server = app.listen(config.port, () => {
    logger.info(
      { port: config.port, env: config.env, admin: `/api/${config.adminUrlPath}` },
      "Aethera API listening",
    );
    verifyMailConnection()
    .then((result) => {
      logger.info({ result }, "SMTP verification completed");
    })
    .catch((err) => {
      logger.error({ err }, "SMTP verification failed");
    });
  });

  // Without this, an in-flight request is severed mid-write on redeploy and
  // the Mongo connection is left dangling. Django's runserver did this for us.
  const shutdown = async (signal) => {
    logger.info({ signal }, "Shutting down");
    server.close(async () => {
      await disconnectDatabase();
      process.exit(0);
    });
    // Fallback if a socket refuses to drain.
    setTimeout(() => process.exit(1), 10_000).unref();
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));

  process.on("unhandledRejection", (reason) => {
    logger.error({ err: reason instanceof Error ? reason.message : String(reason) }, "Unhandled rejection");
  });
}

main().catch((err) => {
  logger.error({ err: err.message, stack: err.stack }, "Failed to start server");
  process.exit(1);
});
