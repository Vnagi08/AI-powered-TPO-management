import { connectDB } from "@tpo/db";
import { env } from "./env.js";
import { logger } from "./logger.js";

export async function initDB(): Promise<void> {
  await connectDB(env.MONGODB_URI);
  logger.info("MongoDB connected");
}
