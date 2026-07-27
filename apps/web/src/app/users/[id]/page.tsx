"use client";

import type { BackofficeUser, UpdateUserRequest } from "@socios/shared";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { UserForm } from "@/components/user-form";
import { useAuth } from "@/context/auth-context";
import { apiClient } from "@/lib/api-client";

export default function EditUserPage() {
  const { isSuperAdmin, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [user, setUser] = useState<BackofficeUser | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isSuperAdmin) {
      router.replace("/members");
    }
  }, [authLoading, isSuperAdmin, router]);

  useEffect(() => {
    async function load() {
      try {
        const data = await apiClient.getUser(params.id);
        setUser(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "No se pudo cargar el usuario");
      }
    }
    if (isSuperAdmin) {
      void load();
    }
  }, [isSuperAdmin, params.id]);

  if (!isSuperAdmin) {
    return null;
  }

  async function handleUpdate(values: UpdateUserRequest) {
    await apiClient.updateUser(params.id, values);
    router.push("/users");
  }

  return (
    <AppShell title="Editar usuario">
      {error ? <p className="error">{error}</p> : null}
      {!user && !error ? <p className="muted">Cargando...</p> : null}
      {user ? (
        <UserForm
          mode="edit"
          submitLabel="Guardar cambios"
          initial={user}
          onSubmit={handleUpdate}
        />
      ) : null}
    </AppShell>
  );
}
