"use client";

import type { CreateMemberRequest, Member } from "@socios/shared";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { MemberForm } from "@/components/member-form";
import { useAuth } from "@/context/auth-context";
import { apiClient } from "@/lib/api-client";

export default function EditMemberPage() {
  const { isAdmin, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [member, setMember] = useState<Member | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      router.replace("/members");
    }
  }, [authLoading, isAdmin, router]);

  useEffect(() => {
    async function load() {
      try {
        const data = await apiClient.getMember(params.id);
        setMember(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "No se pudo cargar el socio");
      }
    }
    if (isAdmin) {
      void load();
    }
  }, [isAdmin, params.id]);

  if (!isAdmin) {
    return null;
  }

  async function handleUpdate(values: CreateMemberRequest) {
    await apiClient.updateMember(params.id, {
      fullName: values.fullName,
      age: values.age,
      phone: values.phone,
      condition: values.condition,
      status: values.status,
    });
    router.push("/members");
  }

  return (
    <AppShell title="Editar socio">
      {error ? <p className="error">{error}</p> : null}
      {!member && !error ? <p className="muted">Cargando...</p> : null}
      {member ? (
        <MemberForm
          emailReadOnly
          submitLabel="Guardar cambios"
          initial={member}
          onSubmit={handleUpdate}
        />
      ) : null}
    </AppShell>
  );
}
