import { initDB } from "./config/db.js";
import { env } from "./config/env.js";
import { logger } from "./config/logger.js";
import { startConsumers } from "./queue/consumer.js";

async function main() {
  await initDB();
  startConsumers();
  logger.info({ dryRun: env.DRY_RUN }, "AI worker consumers started");
}

main().catch((err) => {
  logger.error({ err }, "Failed to start AI worker");
  process.exit(1);
});
