import { apiClient, setAccessToken } from "../../lib/apiClient";
import type { AuthUser, UserRole } from "./types";

export interface RegisterPayload {
  email: string;
  password: string;
  fullName: string;
  role: Extract<UserRole, "student" | "recruiter">;
}

export interface LoginPayload {
  email: string;
  password: string;
}

interface AuthResponse {
  accessToken: string;
  user: AuthUser;
}

export async function registerRequest(
  payload: RegisterPayload,
): Promise<{ message: string; user: AuthUser }> {
  const { data } = await apiClient.post("/auth/register", payload);
  return data;
}

export async function loginRequest(payload: LoginPayload): Promise<AuthUser> {
  const { data } = await apiClient.post<AuthResponse>("/auth/login", payload);
  setAccessToken(data.accessToken);
  return data.user;
}

/** Attempts a silent refresh using the httpOnly cookie. Never throws — returns null on failure. */
export async function refreshRequest(): Promise<AuthUser | null> {
  try {
    const { data } = await apiClient.post<AuthResponse>("/auth/refresh");
    setAccessToken(data.accessToken);
    return data.user;
  } catch {
    setAccessToken(null);
    return null;
  }
}

export async function logoutRequest(): Promise<void> {
  await apiClient.post("/auth/logout").catch(() => {});
  setAccessToken(null);
}

export async function verifyEmailRequest(token: string): Promise<{ message: string }> {
  const { data } = await apiClient.post("/auth/verify-email", { token });
  return data;
}

export async function forgotPasswordRequest(email: string): Promise<{ message: string }> {
  const { data } = await apiClient.post("/auth/forgot-password", { email });
  return data;
}

export async function resetPasswordRequest(
  token: string,
  newPassword: string,
): Promise<{ message: string }> {
  const { data } = await apiClient.post("/auth/reset-password", { token, newPassword });
  return data;
}
