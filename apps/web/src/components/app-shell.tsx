"use client";

import { USER_ROLE_LABELS, USER_ROLES } from "@socios/shared";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { type ReactNode, useCallback, useEffect, useId, useState } from "react";
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
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuId = useId();

  const closeMenu = useCallback(() => setMenuOpen(false), []);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/");
    }
  }, [loading, user, router]);

  useEffect(() => {
    closeMenu();
  }, [pathname, closeMenu]);

  useEffect(() => {
    if (!menuOpen) {
      return;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeMenu();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [menuOpen, closeMenu]);

  if (loading || !user) {
    return (
      <main className="login-page">
        <p className="muted">Cargando...</p>
      </main>
    );
  }

  const isSuperAdmin = user.role === USER_ROLES.SUPER_ADMIN;

  async function handleLogout() {
    closeMenu();
    await logout();
    router.replace("/");
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <Link href="/members" className="brand">
          <span className="brand-full">Socios Backoffice</span>
          <span className="brand-short">Socios</span>
        </Link>

        <nav className="topbar-nav topbar-nav-desktop" aria-label="Principal">
          <Link href="/members">Socios</Link>
          {isSuperAdmin ? <Link href="/users">Usuarios</Link> : null}
        </nav>

        <div className="topbar-actions topbar-actions-desktop">
          <span className="topbar-user" title={`${user.name} · ${USER_ROLE_LABELS[user.role]}`}>
            {user.name} · {USER_ROLE_LABELS[user.role]}
          </span>
          <ThemeToggle />
          <button type="button" className="btn btn-secondary" onClick={() => void handleLogout()}>
            Salir
          </button>
        </div>

        <button
          type="button"
          className="menu-toggle"
          aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={menuOpen}
          aria-controls={menuId}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span className="menu-toggle-bars" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
        </button>
      </header>

      <div
        className={`mobile-menu-backdrop${menuOpen ? " is-open" : ""}`}
        aria-hidden={!menuOpen}
        onClick={closeMenu}
      />

      <nav
        id={menuId}
        className={`mobile-menu${menuOpen ? " is-open" : ""}`}
        aria-label="Menú móvil"
        aria-hidden={!menuOpen}
      >
        <div className="mobile-menu-header">
          <p className="mobile-menu-user">
            {user.name}
            <span className="muted"> · {USER_ROLE_LABELS[user.role]}</span>
          </p>
          <button type="button" className="btn btn-secondary btn-sm" onClick={closeMenu}>
            Cerrar
          </button>
        </div>
        <div className="mobile-menu-links">
          <Link href="/members" onClick={closeMenu}>
            Socios
          </Link>
          {isSuperAdmin ? (
            <Link href="/users" onClick={closeMenu}>
              Usuarios
            </Link>
          ) : null}
        </div>
        <div className="mobile-menu-footer">
          <ThemeToggle className="btn btn-secondary theme-toggle mobile-menu-theme" />
          <button type="button" className="btn btn-secondary" onClick={() => void handleLogout()}>
            Salir
          </button>
        </div>
      </nav>

      <main className="container">
        <div className="page-header">
          <h1>{title}</h1>
          {actions ? <div className="page-header-actions">{actions}</div> : null}
        </div>
        {children}
      </main>
    </div>
  );
}
