import { Queue } from "bullmq";
import { QUEUE_NAMES } from "@tpo/shared";
import { redisConnection } from "../config/redis.js";

// Producer side only — apps/server enqueues jobs, apps/ai-worker processes them.
export const parseResumeQueue = new Queue(QUEUE_NAMES.PARSE_RESUME, {
  connection: redisConnection,
});

export const screenApplicationQueue = new Queue(QUEUE_NAMES.SCREEN_APPLICATION, {
  connection: redisConnection,
});
