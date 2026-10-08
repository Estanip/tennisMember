"use client";

import type { MemberAuditAction, MemberAuditEntry, MemberAuditSnapshot } from "@socios/shared";
import {
  getMemberStatusLabel,
  MEMBER_AUDIT_ACTION_LABELS,
  MEMBER_AUDIT_SOURCE_LABELS,
  MEMBER_CONDITION_LABELS,
  MEMBER_DELETE_REASON_LABELS,
  USER_ROLE_LABELS,
} from "@socios/shared";
import { useCallback, useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";

const PAGE_SIZE = 10;

type DisplayField = Exclude<keyof MemberAuditSnapshot, "id" | "createdAt" | "updatedAt">;

const FIELD_LABELS: Record<DisplayField, string> = {
  firstName: "Nombre",
  lastName: "Apellido",
  memberId: "Nro. Socio",
  email: "Email",
  dni: "DNI",
  birthDate: "Fecha de nacimiento",
  phone: "Teléfono",
  condition: "Condición",
  status: "Estado",
  deletedAt: "Fecha de baja",
  deletedReason: "Motivo de baja",
  deletedReasonDetail: "Detalle de baja",
};

const ACTION_BADGE_CLASS: Record<MemberAuditAction, string> = {
  CREATE: "enabled",
  UPDATE: "",
  DELETE: "disabled",
  RESTORE: "pending",
};

const FIELD_ORDER = Object.keys(FIELD_LABELS) as DisplayField[];

function isDisplayField(field: string): field is DisplayField {
  return field in FIELD_LABELS;
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("es-AR", { dateStyle: "short", timeStyle: "short" });
}

function formatIsoDate(iso: string): string {
  const [year, month, day] = iso.split("-");
  return `${day}/${month}/${year}`;
}

function formatFieldValue(field: DisplayField, snapshot: MemberAuditSnapshot | null): string {
  if (!snapshot) return "—";
  const value = snapshot[field];
  if (value === null || value === "") return "—";

  switch (field) {
    case "status":
      return getMemberStatusLabel(snapshot.status);
    case "condition":
      return MEMBER_CONDITION_LABELS[snapshot.condition] ?? snapshot.condition;
    case "deletedReason":
      return snapshot.deletedReason ? MEMBER_DELETE_REASON_LABELS[snapshot.deletedReason] : "—";
    case "birthDate":
      return formatIsoDate(snapshot.birthDate);
    case "deletedAt":
      return snapshot.deletedAt ? formatDateTime(snapshot.deletedAt) : "—";
    default:
      return String(value);
  }
}

function formatActor(entry: MemberAuditEntry): string {
  if (!entry.actor) {
    return entry.source === "GOOGLE_FORM" ? "Google Form (sin usuario)" : "Sistema";
  }
  const { name, email, role } = entry.actor;
  const who = name && email ? `${name} (${email})` : (name ?? email ?? entry.actor.userId);
  return role ? `${who} · ${USER_ROLE_LABELS[role]}` : who;
}

function changedDisplayFields(entry: MemberAuditEntry): DisplayField[] {
  const changed = new Set(entry.changedFields.filter(isDisplayField));
  return FIELD_ORDER.filter(
    (field) => changed.has(field) && (entry.action !== "CREATE" || entry.after[field] !== null),
  );
}

function AuditEntryItem({ entry }: { entry: MemberAuditEntry }) {
  const fields = changedDisplayFields(entry);
  const isCreate = entry.action === "CREATE";

  return (
    <li className="audit-entry">
      <div className="audit-entry-header">
        <span className={`badge ${ACTION_BADGE_CLASS[entry.action]}`}>
          {MEMBER_AUDIT_ACTION_LABELS[entry.action]}
        </span>
        <span className="audit-entry-date">{formatDateTime(entry.createdAt)}</span>
        <span className="muted">· {MEMBER_AUDIT_SOURCE_LABELS[entry.source]}</span>
      </div>
      <p className="audit-entry-actor muted">{formatActor(entry)}</p>
      {fields.length > 0 ? (
        <div className="table-wrap">
          <table className="audit-changes">
            <thead>
              <tr>
                <th>Campo</th>
                {isCreate ? null : <th>Antes</th>}
                <th>{isCreate ? "Valor inicial" : "Después"}</th>
              </tr>
            </thead>
            <tbody>
              {fields.map((field) => (
                <tr key={field}>
                  <td>{FIELD_LABELS[field]}</td>
                  {isCreate ? null : <td>{formatFieldValue(field, entry.before)}</td>}
                  <td>{formatFieldValue(field, entry.after)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </li>
  );
}

export function MemberAuditHistory({ memberId }: { memberId: string }) {
  const [items, setItems] = useState<MemberAuditEntry[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPage = useCallback(
    async (nextPage: number) => {
      setLoading(true);
      setError(null);
      try {
        const result = await apiClient.getMemberAudit(memberId, {
          page: nextPage,
          pageSize: PAGE_SIZE,
        });
        setItems((prev) => (nextPage === 1 ? result.items : [...prev, ...result.items]));
        setPage(result.page);
        setTotalPages(result.totalPages);
      } catch (err) {
        setError(err instanceof Error ? err.message : "No se pudo cargar el historial");
      } finally {
        setLoading(false);
      }
    },
    [memberId],
  );

  useEffect(() => {
    void loadPage(1);
  }, [loadPage]);

  return (
    <div className="stack">
      {error ? <p className="error">{error}</p> : null}
      {!loading && !error && items.length === 0 ? (
        <p className="muted">Sin movimientos registrados.</p>
      ) : null}
      {items.length > 0 ? (
        <ul className="audit-list">
          {items.map((entry) => (
            <AuditEntryItem key={entry.id} entry={entry} />
          ))}
        </ul>
      ) : null}
      {loading ? <p className="muted">Cargando historial...</p> : null}
      {!loading && page > 0 && page < totalPages ? (
        <div className="actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => void loadPage(page + 1)}
          >
            Ver más
          </button>
        </div>
      ) : null}
    </div>
  );
}
