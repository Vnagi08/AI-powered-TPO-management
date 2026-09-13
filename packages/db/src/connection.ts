import mongoose from "mongoose";
import { toJSONPlugin } from "./plugins/toJSON.plugin.js";

// Registered once, applies to every schema defined afterwards — see index.ts,
// which imports this module before any model file.
mongoose.plugin(toJSONPlugin);

let listenersAttached = false;

function attachListeners(): void {
  if (listenersAttached) return;
  listenersAttached = true;

  mongoose.connection.on("connected", () => {
    console.log("[db] connected");
  });
  mongoose.connection.on("error", (err) => {
    console.error("[db] connection error", err);
  });
  mongoose.connection.on("disconnected", () => {
    console.warn("[db] disconnected");
  });
}

export async function connectDB(uri: string): Promise<typeof mongoose> {
  attachListeners();
  return mongoose.connect(uri);
}

export async function disconnectDB(): Promise<void> {
  await mongoose.disconnect();
}

export { mongoose };
