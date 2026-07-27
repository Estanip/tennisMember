"use client";

import type { PaginatedUsers } from "@socios/shared";
import { USER_ROLE_LABELS } from "@socios/shared";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { useAuth } from "@/context/auth-context";
import { apiClient } from "@/lib/api-client";

export default function UsersPage() {
  const { isSuperAdmin, loading: authLoading } = useAuth();
  const [data, setData] = useState<PaginatedUsers | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiClient.listUsers({
        page,
        pageSize: 10,
        search: search.trim() || undefined,
      });
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cargar el listado");
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    if (isSuperAdmin) {
      void load();
    }
  }, [isSuperAdmin, load]);

  if (authLoading) {
    return (
      <main className="login-page">
        <p className="muted">Cargando...</p>
      </main>
    );
  }

  if (!isSuperAdmin) {
    return (
      <AppShell title="Usuarios">
        <p className="error">No tenés permiso para acceder a esta sección.</p>
      </AppShell>
    );
  }

  return (
    <AppShell
      title="Usuarios"
      actions={
        <Link className="btn" href="/users/new">
          Nuevo usuario
        </Link>
      }
    >
      <section className="card stack">
        <div className="field">
          <label htmlFor="user-search">Búsqueda</label>
          <input
            id="user-search"
            placeholder="Nombre, usuario o email"
            value={search}
            onChange={(e) => {
              setPage(1);
              setSearch(e.target.value);
            }}
          />
        </div>

        {error ? <p className="error">{error}</p> : null}
        {loading ? <p className="muted">Cargando usuarios...</p> : null}

        {!loading && data ? (
          <>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Usuario</th>
                    <th>Email</th>
                    <th>Rol</th>
                    <th className="col-actions">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="muted">
                        No hay usuarios para mostrar
                      </td>
                    </tr>
                  ) : (
                    data.items.map((user) => (
                      <tr key={user.id}>
                        <td>{user.name}</td>
                        <td>{user.username ?? "—"}</td>
                        <td>{user.email}</td>
                        <td>{USER_ROLE_LABELS[user.role]}</td>
                        <td className="col-actions">
                          <Link className="link-action" href={`/users/${user.id}`}>
                            Editar
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="pagination">
              <span className="muted">
                Página {data.page} de {data.totalPages} · {data.total} usuarios
              </span>
              <div className="actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(p - 1, 1))}
                >
                  Anterior
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  disabled={page >= data.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Siguiente
                </button>
              </div>
            </div>
          </>
        ) : null}
      </section>
    </AppShell>
  );
}
