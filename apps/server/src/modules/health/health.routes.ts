import { Router } from "express";
import mongoose from "mongoose";
import { redisConnection } from "../../config/redis.js";

export const healthRouter = Router();

healthRouter.get("/", (_req, res) => {
  res.json({ status: "ok", service: "server", timestamp: new Date().toISOString() });
});

healthRouter.get("/ready", async (_req, res) => {
  const dbState = mongoose.connection.readyState; // 1 = connected
  let redisOk = false;
  try {
    redisOk = (await redisConnection.ping()) === "PONG";
  } catch {
    redisOk = false;
  }

  const ready = dbState === 1 && redisOk;
  res.status(ready ? 200 : 503).json({
    status: ready ? "ready" : "not_ready",
    db: dbState === 1 ? "connected" : "disconnected",
    redis: redisOk ? "connected" : "disconnected",
  });
});
