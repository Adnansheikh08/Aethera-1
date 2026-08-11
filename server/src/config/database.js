import mongoose from "mongoose";

import { config } from "./index.js";
import { logger } from "../utils/logger.js";

export async function connectDatabase(uri = config.mongoUri) {
  mongoose.set("strictQuery", true);

  mongoose.connection.on("connected", () => logger.info("MongoDB connected"));
  mongoose.connection.on("error", (err) =>
    logger.error({ err: err.message }, "MongoDB connection error"),
  );
  mongoose.connection.on("disconnected", () => logger.warn("MongoDB disconnected"));

  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 5000,
  });

  return mongoose.connection;
}

export async function disconnectDatabase() {
  await mongoose.disconnect();
}
