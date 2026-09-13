import { createApp } from "./app.js";
import { initDB } from "./config/db.js";
import { env } from "./config/env.js";
import { logger } from "./config/logger.js";
import { initSentry } from "./config/sentry.js";
import { startCronJobs } from "./cron/index.js";

async function main() {
  initSentry();
  await initDB();
  const app = createApp();
  startCronJobs();

  app.listen(env.PORT, () => {
    logger.info(`Server listening on port ${env.PORT}`);
  });
}

main().catch((err) => {
  logger.error({ err }, "Failed to start server");
  process.exit(1);
});
