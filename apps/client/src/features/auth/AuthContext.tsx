import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import * as authApi from "./authApi";
import type { AuthUser } from "./types";

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: authApi.RegisterPayload) => Promise<{ message: string; user: AuthUser }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Restores the session on page load/reload via the httpOnly refresh cookie —
    // the access token itself only ever lives in memory, so this is the only
    // way a reload doesn't force a re-login.
    authApi.refreshRequest().then((restoredUser) => {
      setUser(restoredUser);
      setIsLoading(false);
    });
  }, []);

  async function login(email: string, password: string): Promise<void> {
    const loggedInUser = await authApi.loginRequest({ email, password });
    setUser(loggedInUser);
  }

  async function register(
    payload: authApi.RegisterPayload,
  ): Promise<{ message: string; user: AuthUser }> {
    const result = await authApi.registerRequest(payload);
    return { message: result.message, user: result.user };
  }

  async function logout(): Promise<void> {
    await authApi.logoutRequest();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
