"use client";

import { USER_ROLE_LABELS } from "@socios/shared";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type ReactNode, useEffect } from "react";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/context/auth-context";

export function AppShell({
  title,
  actions,
  children,
}: {
  title: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/");
    }
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <main className="login-page">
        <p className="muted">Cargando...</p>
      </main>
    );
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <Link href="/members" className="brand">
          Socios Backoffice
        </Link>
        <div className="topbar-actions">
          <span>
            {user.name} · {USER_ROLE_LABELS[user.role]}
          </span>
          <ThemeToggle />
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              logout();
              router.replace("/");
            }}
          >
            Salir
          </button>
        </div>
      </header>
      <main className="container">
        <div className="page-header">
          <h1>{title}</h1>
          {actions}
        </div>
        {children}
      </main>
    </div>
  );
}
