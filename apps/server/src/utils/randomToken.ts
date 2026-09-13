import { randomBytes } from "node:crypto";

// Used for email-verification and password-reset tokens: single-use, short-lived,
// and looked up by exact match — lower value than passwords/refresh tokens, so
// (unlike those) storing them raw with an expiry is an acceptable tradeoff.
export function generateRandomToken(bytes = 32): string {
  return randomBytes(bytes).toString("hex");
}
