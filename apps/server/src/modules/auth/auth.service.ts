import { User } from "@tpo/db";
import type { LoginInput, RegisterInput, ResetPasswordInput } from "@tpo/shared";
import { env } from "../../config/env.js";
import { hasEmailProvider, sendEmail } from "../../config/email.js";
import { logger } from "../../config/logger.js";
import { AppError } from "../../middleware/errorHandler.js";
import { comparePassword, hashPassword } from "../../utils/password.js";
import { generateRandomToken } from "../../utils/randomToken.js";
import { compareTokenHash, hashToken } from "../../utils/tokenHash.js";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../../utils/jwt.js";
import { toSafeUser, type SafeUser } from "../../utils/safeUser.js";

const EMAIL_VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000;
const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000;

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export async function register(input: RegisterInput): Promise<SafeUser> {
  const existing = await User.findOne({ email: input.email });
  if (existing) {
    throw new AppError(409, "An account with this email already exists");
  }

  const passwordHash = await hashPassword(input.password);
  const emailVerificationToken = generateRandomToken();

  // No real email provider configured — there's no way to actually deliver a
  // verification link, so gating login behind one nobody can receive is just
  // friction, not security. Auto-verify instead. The moment Resend or the
  // Gmail SMTP fallback is configured (a real deployment), this flips back to
  // requiring real verification — same fallback pattern as Cloudinary/DRY_RUN
  // elsewhere.
  const autoVerify = !hasEmailProvider;

  const user = await User.create({
    email: input.email,
    passwordHash,
    fullName: input.fullName,
    role: input.role,
    isEmailVerified: autoVerify,
    emailVerificationToken,
    emailVerificationExpires: new Date(Date.now() + EMAIL_VERIFICATION_TTL_MS),
  });

  // Structured log kept alongside the real send — the one thing that reliably
  // survives across "do I have a real RESEND_API_KEY today or not" during dev.
  logger.info(
    { email: user.email, verificationToken: emailVerificationToken },
    "Email verification link",
  );
  const verifyUrl = `${env.CLIENT_ORIGIN}/verify-email?token=${emailVerificationToken}`;
  await sendEmail({
    to: user.email,
    subject: `Verify your email — ${env.COLLEGE_NAME}`,
    html: `<p>Hi ${user.fullName},</p><p>Click below to verify your email:</p><p><a href="${verifyUrl}">${verifyUrl}</a></p>`,
  });

  return toSafeUser(user);
}

export async function verifyEmail(token: string): Promise<void> {
  const user = await User.findOne({
    emailVerificationToken: token,
    emailVerificationExpires: { $gt: new Date() },
  }).select("+emailVerificationToken +emailVerificationExpires");

  if (!user) {
    throw new AppError(400, "Invalid or expired verification token");
  }

  user.set("isEmailVerified", true);
  user.set("emailVerificationToken", undefined);
  user.set("emailVerificationExpires", undefined);
  await user.save();
}

async function issueTokens(userId: string, role: SafeUser["role"]): Promise<AuthTokens> {
  const accessToken = signAccessToken({ sub: userId, role });
  const refreshToken = signRefreshToken({ sub: userId });
  await User.findByIdAndUpdate(userId, { refreshTokenHash: hashToken(refreshToken) });
  return { accessToken, refreshToken };
}

export async function login(input: LoginInput): Promise<AuthTokens & { user: SafeUser }> {
  const user = await User.findOne({ email: input.email }).select("+passwordHash");
  if (!user || !(await comparePassword(input.password, user.get("passwordHash")))) {
    throw new AppError(401, "Invalid email or password");
  }

  if (user.get("status") === "suspended") {
    throw new AppError(403, "This account has been suspended");
  }

  if (!user.get("isEmailVerified")) {
    throw new AppError(403, "Please verify your email before logging in");
  }

  const tokens = await issueTokens(user._id.toString(), user.get("role"));
  return { ...tokens, user: toSafeUser(user) };
}

export async function refresh(presentedToken: string): Promise<AuthTokens & { user: SafeUser }> {
  let payload;
  try {
    payload = verifyRefreshToken(presentedToken);
  } catch {
    throw new AppError(401, "Invalid or expired refresh token");
  }

  const user = await User.findById(payload.sub).select("+refreshTokenHash");
  const storedHash = user?.get("refreshTokenHash") as string | undefined;
  if (!user || !storedHash) {
    throw new AppError(401, "Session no longer valid — please log in again");
  }

  const isValid = compareTokenHash(presentedToken, storedHash);
  if (!isValid) {
    // Reuse of an already-rotated (or forged) refresh token — revoke the whole
    // session family rather than silently continuing. See ARCHITECTURE.md §6.
    user.set("refreshTokenHash", undefined);
    await user.save();
    throw new AppError(401, "Session invalidated — please log in again");
  }

  const tokens = await issueTokens(user._id.toString(), user.get("role"));
  return { ...tokens, user: toSafeUser(user) };
}

export async function logout(presentedToken: string | undefined): Promise<void> {
  if (!presentedToken) return;
  try {
    const payload = verifyRefreshToken(presentedToken);
    await User.findByIdAndUpdate(payload.sub, { refreshTokenHash: undefined });
  } catch {
    // Already invalid/expired — nothing to revoke.
  }
}

export async function forgotPassword(email: string): Promise<void> {
  const user = await User.findOne({ email });
  // Always behave the same whether or not the account exists — avoids leaking
  // which emails are registered.
  if (!user) return;

  const passwordResetToken = generateRandomToken();
  user.set("passwordResetToken", passwordResetToken);
  user.set("passwordResetExpires", new Date(Date.now() + PASSWORD_RESET_TTL_MS));
  await user.save();

  logger.info({ email, resetToken: passwordResetToken }, "Password reset link");
  const resetUrl = `${env.CLIENT_ORIGIN}/reset-password?token=${passwordResetToken}`;
  await sendEmail({
    to: email,
    subject: `Reset your password — ${env.COLLEGE_NAME}`,
    html: `<p>Click below to reset your password. This link expires in 1 hour.</p><p><a href="${resetUrl}">${resetUrl}</a></p>`,
  });
}

export async function resetPassword(input: ResetPasswordInput): Promise<void> {
  const user = await User.findOne({
    passwordResetToken: input.token,
    passwordResetExpires: { $gt: new Date() },
  }).select("+passwordResetToken +passwordResetExpires");

  if (!user) {
    throw new AppError(400, "Invalid or expired reset token");
  }

  user.set("passwordHash", await hashPassword(input.newPassword));
  user.set("passwordResetToken", undefined);
  user.set("passwordResetExpires", undefined);
  // Force re-login on every device — the password reset itself is evidence the
  // previous session(s) should not be trusted going forward.
  user.set("refreshTokenHash", undefined);
  await user.save();
}
