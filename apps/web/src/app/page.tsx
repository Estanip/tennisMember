"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useState } from "react";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/context/auth-context";

const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE?.trim().toLowerCase() === "true";
const DEMO_EMAIL = process.env.NEXT_PUBLIC_DEMO_ADMIN_EMAIL?.trim() || "admin@socios.demo";
const DEMO_PASSWORD = process.env.NEXT_PUBLIC_DEMO_ADMIN_PASSWORD?.trim() || "DemoAdmin123!";

export default function LoginPage() {
  const { login, user, loading } = useAuth();
  const router = useRouter();
  const [identifier, setIdentifier] = useState(DEMO_MODE ? DEMO_EMAIL : "superadmin");
  const [password, setPassword] = useState(DEMO_MODE ? DEMO_PASSWORD : "");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      router.replace("/members");
    }
  }, [loading, user, router]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await login(identifier, password);
      router.replace("/members");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo iniciar sesión");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="login-page">
      <div className="login-theme-toggle">
        <ThemeToggle />
      </div>
      <section className="card login-card stack">
        <div>
          <p className="login-brand">{DEMO_MODE ? "Administrador de Socios" : "Socios"}</p>
          <p className="login-kicker">Backoffice</p>
          <p className="login-lead">Iniciá sesión para gestionar el padrón</p>
          {DEMO_MODE ? (
            <p className="muted" style={{ marginTop: "0.75rem", fontSize: "0.8rem" }}>
              Demo: {DEMO_EMAIL} · {DEMO_PASSWORD}
            </p>
          ) : null}
        </div>
        <form className="stack" onSubmit={onSubmit}>
          <div className="field">
            <label htmlFor="identifier">Email o usuario</label>
            <input
              id="identifier"
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
              autoComplete="username"
            />
          </div>
          <div className="field">
            <label htmlFor="password">Contraseña</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>
          {error ? <p className="error">{error}</p> : null}
          <button className="btn" type="submit" disabled={submitting}>
            {submitting ? "Ingresando..." : "Ingresar"}
          </button>
        </form>
      </section>
    </main>
  );
}
