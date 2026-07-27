"use client";

import type { CreateUserRequest } from "@socios/shared";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { AppShell } from "@/components/app-shell";
import { UserForm } from "@/components/user-form";
import { useAuth } from "@/context/auth-context";
import { apiClient } from "@/lib/api-client";

export default function NewUserPage() {
  const { isSuperAdmin, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isSuperAdmin) {
      router.replace("/members");
    }
  }, [isSuperAdmin, loading, router]);

  if (!isSuperAdmin) {
    return null;
  }

  async function handleCreate(values: CreateUserRequest) {
    await apiClient.createUser(values);
    router.push("/users");
  }

  return (
    <AppShell title="Nuevo usuario">
      <UserForm mode="create" submitLabel="Crear usuario" onSubmit={handleCreate} />
    </AppShell>
  );
}
