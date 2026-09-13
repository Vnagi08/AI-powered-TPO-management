import { randomBytes } from "node:crypto";
import { connectDB, disconnectDB, User } from "@tpo/db";
import { env } from "../config/env.js";
import { hashPassword } from "../utils/password.js";

/**
 * Self-service bootstrap for a new college's first tpo_admin account.
 * tpo_admin accounts are never self-registered through the public API (see
 * ARCHITECTURE.md §6) — this script is the supported way for a college
 * standing up their own deployment of this template to create that account
 * without needing a one-off DB script written for them.
 *
 * Usage:
 *   npm run seed:admin -- --email admin@college.edu --name "TPO Admin" [--password "..."] [--force]
 *
 * Flags can also be supplied via env vars: SEED_ADMIN_EMAIL, SEED_ADMIN_NAME,
 * SEED_ADMIN_PASSWORD. If --password is omitted, a strong random password is
 * generated and printed once — save it, it is not shown again.
 * --force allows resetting the password of an existing account with this email.
 */

function parseArgs(): { email?: string; name?: string; password?: string; force: boolean } {
  const args = process.argv.slice(2);
  const out: { email?: string; name?: string; password?: string; force: boolean } = { force: false };
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--email") out.email = args[++i];
    else if (arg === "--name") out.name = args[++i];
    else if (arg === "--password") out.password = args[++i];
    else if (arg === "--force") out.force = true;
  }
  return out;
}

function generatePassword(): string {
  // 18 random bytes -> 24 base64url chars, plus a guaranteed digit+symbol so it
  // always satisfies typical password policies even though this one isn't enforced.
  return `${randomBytes(18).toString("base64url")}!9`;
}

async function main(): Promise<void> {
  const args = parseArgs();
  const email = (args.email ?? process.env.SEED_ADMIN_EMAIL)?.trim().toLowerCase();
  const fullName = (args.name ?? process.env.SEED_ADMIN_NAME)?.trim();
  const providedPassword = args.password ?? process.env.SEED_ADMIN_PASSWORD;

  if (!email || !fullName) {
    console.error(
      "Usage: npm run seed:admin -- --email admin@college.edu --name \"TPO Admin\" [--password \"...\"] [--force]\n" +
        "(email and name are also readable from SEED_ADMIN_EMAIL / SEED_ADMIN_NAME / SEED_ADMIN_PASSWORD env vars)",
    );
    process.exit(1);
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    console.error(`Not a valid email: ${email}`);
    process.exit(1);
  }
  if (providedPassword && (providedPassword.length < 8 || providedPassword.length > 72)) {
    console.error("Password must be between 8 and 72 characters.");
    process.exit(1);
  }

  await connectDB(env.MONGODB_URI);

  const existing = await User.findOne({ email });
  if (existing && !args.force) {
    console.error(
      `A user with email ${email} already exists (role: ${existing.get("role")}). ` +
        "Pass --force to reset their password and promote them to tpo_admin, or use a different email.",
    );
    await disconnectDB();
    process.exit(1);
  }

  const password = providedPassword ?? generatePassword();
  const passwordHash = await hashPassword(password);

  const admin = await User.findOneAndUpdate(
    { email },
    {
      email,
      passwordHash,
      fullName,
      role: "tpo_admin",
      isEmailVerified: true,
      status: "active",
    },
    { upsert: true, new: true },
  );

  console.log(`Admin ready: ${admin?.get("email")} (${admin?._id})`);
  if (!providedPassword) {
    console.log(`Generated password (shown once — save it now): ${password}`);
  }
  await disconnectDB();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
