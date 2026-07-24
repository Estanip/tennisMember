"use client";

import type { CreateMemberRequest } from "@socios/shared";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { AppShell } from "@/components/app-shell";
import { MemberForm } from "@/components/member-form";
import { useAuth } from "@/context/auth-context";
import { apiClient } from "@/lib/api-client";

export default function NewMemberPage() {
  const { isAdmin, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAdmin) {
      router.replace("/members");
    }
  }, [isAdmin, loading, router]);

  if (!isAdmin) {
    return null;
  }

  async function handleCreate(values: CreateMemberRequest) {
    await apiClient.createMember(values);
    router.push("/members");
  }

  return (
    <AppShell title="Nuevo socio">
      <MemberForm submitLabel="Crear socio" onSubmit={handleCreate} />
    </AppShell>
  );
}
