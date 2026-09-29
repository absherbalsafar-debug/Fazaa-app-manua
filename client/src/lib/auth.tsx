import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

export interface AuthUser {
  id: number;
  openId?: string;
  name: string;
  phone?: string;
  email: string | null;
  role: "admin" | "user" | "client" | "provider";
  status?: string;
  avatarUrl?: string | null;
  phoneVerified?: boolean;
  emailVerified?: boolean;
  city?: string | null;
  createdAt: string;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  login: (token: string, user: AuthUser) => void;
  logout: () => void;
  updateUser: (user: AuthUser) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const API_BASE = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");
const TOKEN_KEY = "fazaah_token";

export async function apiRequest(path: string, options: RequestInit = {}) {
  const token = localStorage.getItem(TOKEN_KEY);
  const res = await fetch(`${API_BASE}/api${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || "حدث خطأ ما");
  }
  return res.json();
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem(TOKEN_KEY));
  const [isLoading, setIsLoading] = useState(true);

  const logout = useCallback(() => {
    void fetch(`${API_BASE}/api/admin/logout`, { method: "POST", credentials: "include", keepalive: true }).catch(() => undefined);
    localStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function loadUser() {
      try {
        const userData = await apiRequest("/admin/session");
        if (!cancelled) setUser(userData);
      } catch {
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    void loadUser();
    return () => { cancelled = true; };
  }, [token]);

  const login = useCallback((newToken: string, newUser: AuthUser) => {
    localStorage.setItem(TOKEN_KEY, newToken);
    setToken(newToken);
    setUser(newUser);
  }, []);
  const updateUser = useCallback((newUser: AuthUser) => setUser(newUser), []);

  return <AuthContext.Provider value={{ user, token, isLoading, login, logout, updateUser }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
