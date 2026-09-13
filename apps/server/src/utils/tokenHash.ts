import { createHash, timingSafeEqual } from "node:crypto";

/**
 * For hashing opaque/signed tokens (refresh JWTs) at rest — NOT passwords.
 *
 * bcrypt truncates input at 72 bytes, which silently breaks it for long tokens:
 * two refresh JWTs for the same user share an identical prefix (header + `sub`
 * claim) that alone exceeds 72 bytes, so the differentiating `jti` never reaches
 * bcrypt and every token for a user hashes identically. Tokens are already
 * high-entropy (HMAC-signed), so they don't need bcrypt's slow, salted hashing —
 * a plain SHA-256 digest is the correct tool here.
 */
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function compareTokenHash(token: string, storedHash: string): boolean {
  const presented = Buffer.from(hashToken(token), "hex");
  const stored = Buffer.from(storedHash, "hex");
  if (presented.length !== stored.length) return false;
  return timingSafeEqual(presented, stored);
}
