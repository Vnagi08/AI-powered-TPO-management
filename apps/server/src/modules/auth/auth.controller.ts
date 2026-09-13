import type { CookieOptions, Request, Response } from "express";
import type {
  ForgotPasswordInput,
  LoginInput,
  RegisterInput,
  ResetPasswordInput,
  VerifyEmailInput,
} from "@tpo/shared";
import { env } from "../../config/env.js";
import { parseDurationMs } from "../../utils/duration.js";
import * as authService from "./auth.service.js";

const REFRESH_COOKIE_NAME = "refreshToken";

// Scoped to /api/v1/auth so the browser only ever sends this cookie to the
// auth endpoints that need it (refresh, logout) — not the whole API surface.
const REFRESH_COOKIE_OPTIONS: CookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite: "strict",
  path: "/api/v1/auth",
  maxAge: parseDurationMs(env.JWT_REFRESH_EXPIRES),
};

function setRefreshCookie(res: Response, token: string): void {
  res.cookie(REFRESH_COOKIE_NAME, token, REFRESH_COOKIE_OPTIONS);
}

function clearRefreshCookie(res: Response): void {
  res.clearCookie(REFRESH_COOKIE_NAME, { ...REFRESH_COOKIE_OPTIONS, maxAge: undefined });
}

export async function registerHandler(req: Request, res: Response): Promise<void> {
  const input = req.body as RegisterInput;
  const user = await authService.register(input);
  res.status(201).json({
    message: user.isEmailVerified
      ? "Registered — your email is auto-verified. You can log in now."
      : "Registered — check your email to verify your account before logging in.",
    user,
  });
}

export async function verifyEmailHandler(req: Request, res: Response): Promise<void> {
  const { token } = req.body as VerifyEmailInput;
  await authService.verifyEmail(token);
  res.json({ message: "Email verified — you can now log in." });
}

export async function loginHandler(req: Request, res: Response): Promise<void> {
  const input = req.body as LoginInput;
  const { accessToken, refreshToken, user } = await authService.login(input);
  setRefreshCookie(res, refreshToken);
  res.json({ accessToken, user });
}

export async function refreshHandler(req: Request, res: Response): Promise<void> {
  const presentedToken = req.cookies?.[REFRESH_COOKIE_NAME] as string | undefined;
  if (!presentedToken) {
    res.status(401).json({ error: "No refresh token provided" });
    return;
  }

  const { accessToken, refreshToken, user } = await authService.refresh(presentedToken);
  setRefreshCookie(res, refreshToken);
  res.json({ accessToken, user });
}

export async function logoutHandler(req: Request, res: Response): Promise<void> {
  const presentedToken = req.cookies?.[REFRESH_COOKIE_NAME] as string | undefined;
  await authService.logout(presentedToken);
  clearRefreshCookie(res);
  res.status(204).send();
}

export async function forgotPasswordHandler(req: Request, res: Response): Promise<void> {
  const { email } = req.body as ForgotPasswordInput;
  await authService.forgotPassword(email);
  res.json({ message: "If that email is registered, a reset link has been sent." });
}

export async function resetPasswordHandler(req: Request, res: Response): Promise<void> {
  const input = req.body as ResetPasswordInput;
  await authService.resetPassword(input);
  res.json({ message: "Password reset — you can now log in with your new password." });
}
