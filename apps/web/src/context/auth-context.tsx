"use client";

import type { AuthUser } from "@socios/shared";
import { canManageMembers, canManageUsers } from "@socios/shared";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { apiClient } from "@/lib/api-client";

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  /** @deprecated Use canWriteMembers */
  isAdmin: boolean;
  canWriteMembers: boolean;
  isSuperAdmin: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    apiClient.clearLegacyToken();
    try {
      const me = await apiClient.me();
      setUser(me);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const login = useCallback(async (identifier: string, password: string) => {
    const result = await apiClient.login({ identifier, password });
    setUser(result.user);
  }, []);

  const logout = useCallback(async () => {
    await apiClient.logout();
    setUser(null);
  }, []);

  const canWriteMembers = user ? canManageMembers(user.role) : false;
  const isSuperAdmin = user ? canManageUsers(user.role) : false;

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      isAdmin: canWriteMembers,
      canWriteMembers,
      isSuperAdmin,
      login,
      logout,
      refresh,
    }),
    [user, loading, canWriteMembers, isSuperAdmin, login, logout, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
