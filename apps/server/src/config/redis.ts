import { Redis } from "ioredis";
import { env } from "./env.js";

// maxRetriesPerRequest: null is required by BullMQ's blocking connections.
export const redisConnection = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: null,
});
