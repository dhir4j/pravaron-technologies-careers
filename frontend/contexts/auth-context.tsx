"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api, ApiError } from "@/lib/api";
import type { User } from "@/lib/types";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  refresh: () => Promise<User | null>;
  login: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);
const AUTH_CACHE_KEY = "pravaron-careers-auth-user";
const AUTH_CACHE_MAX_AGE_MS = 1000 * 60 * 60 * 12;

function readCachedUser(): User | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(AUTH_CACHE_KEY);
    if (!raw) return null;
    const cached = JSON.parse(raw) as { user?: User; cached_at?: number };
    if (!cached.user || !cached.cached_at || Date.now() - cached.cached_at > AUTH_CACHE_MAX_AGE_MS) {
      window.sessionStorage.removeItem(AUTH_CACHE_KEY);
      return null;
    }
    return cached.user;
  } catch {
    window.sessionStorage.removeItem(AUTH_CACHE_KEY);
    return null;
  }
}

function writeCachedUser(user: User | null) {
  if (typeof window === "undefined") return;
  if (!user) {
    window.sessionStorage.removeItem(AUTH_CACHE_KEY);
    return;
  }
  window.sessionStorage.setItem(AUTH_CACHE_KEY, JSON.stringify({ user, cached_at: Date.now() }));
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const response = await api<{ user: User }>("/auth/me");
      setUser(response.user);
      writeCachedUser(response.user);
      return response.user;
    } catch (error) {
      if (!(error instanceof ApiError) || error.status !== 401) {
        console.error(error);
      }
      setUser(null);
      writeCachedUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined" && window.location.pathname.startsWith("/interview/")) {
      setLoading(false);
      return;
    }
    const cachedUser = readCachedUser();
    if (cachedUser) {
      setUser(cachedUser);
      setLoading(false);
    }
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const clearExpiredSession = () => {
      setUser(null);
      writeCachedUser(null);
      setLoading(false);
    };
    window.addEventListener("pravaron-auth:unauthorized", clearExpiredSession);
    return () => window.removeEventListener("pravaron-auth:unauthorized", clearExpiredSession);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const response = await api<{ user: User }>("/auth/login", {
      method: "POST",
      body: { email, password },
    });
    setUser(response.user);
    writeCachedUser(response.user);
    return response.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await api("/auth/logout", { method: "POST" });
    } catch (error) {
      if (!(error instanceof ApiError) || error.status !== 401) throw error;
    } finally {
      setUser(null);
      writeCachedUser(null);
    }
  }, []);

  const value = useMemo(
    () => ({ user, loading, refresh, login, logout }),
    [user, loading, refresh, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
}
