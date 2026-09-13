import { Worker } from "bullmq";
import { QUEUE_NAMES } from "@tpo/shared";
import { redisConnection } from "../config/redis.js";
import { logger } from "../config/logger.js";
import { processParseResume } from "./processors/parseResume.processor.js";
import { processScreenApplication } from "./processors/screenApplication.processor.js";

export function startConsumers(): Worker[] {
  const parseResumeWorker = new Worker(
    QUEUE_NAMES.PARSE_RESUME,
    async (job) => processParseResume(job.data),
    { connection: redisConnection },
  );

  const screenApplicationWorker = new Worker(
    QUEUE_NAMES.SCREEN_APPLICATION,
    async (job) => processScreenApplication(job.data),
    { connection: redisConnection },
  );

  for (const worker of [parseResumeWorker, screenApplicationWorker]) {
    worker.on("completed", (job) => logger.info({ jobId: job.id, queue: job.queueName }, "Job completed"));
    worker.on("failed", (job, err) =>
      logger.error({ jobId: job?.id, queue: job?.queueName, err }, "Job failed"),
    );
  }

  return [parseResumeWorker, screenApplicationWorker];
}
