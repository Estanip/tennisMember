"use client";

import type {
  Member,
  MemberCondition,
  MemberDeleteReason,
  MemberStatus,
  PaginatedMembers,
} from "@socios/shared";
import {
  getMemberStatusLabel,
  MEMBER_CONDITION_LABELS,
  MEMBER_CONDITIONS,
  MEMBER_DELETE_REASON_DETAIL_MAX_LENGTH,
  MEMBER_DELETE_REASON_LABELS,
  MEMBER_DELETE_REASON_VALUES,
  MEMBER_DELETE_REASONS,
  MEMBER_STATUS,
  MEMBER_STATUS_LABELS,
  MEMBER_STATUS_VALUES,
} from "@socios/shared";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { useAuth } from "@/context/auth-context";
import { apiClient } from "@/lib/api-client";

function statusTextClass(status: number): string {
  if (status === MEMBER_STATUS.ENABLED) return "status-text enabled";
  if (status === MEMBER_STATUS.PENDING) return "status-text pending";
  if (status === MEMBER_STATUS.DELETED) return "status-text deleted";
  return "status-text disabled";
}

function formatDeleteReason(member: Member): string | null {
  if (!member.deletedReason) return null;
  const label = MEMBER_DELETE_REASON_LABELS[member.deletedReason];
  if (member.deletedReason === MEMBER_DELETE_REASONS.OTRA && member.deletedReasonDetail) {
    return `${label}: ${member.deletedReasonDetail}`;
  }
  return label;
}

export default function MembersPage() {
  const { isAdmin } = useAuth();
  const [data, setData] = useState<PaginatedMembers | null>(null);
  const [search, setSearch] = useState("");
  const [condition, setCondition] = useState<"" | MemberCondition>("");
  const [status, setStatus] = useState<"" | MemberStatus | number>("");
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [memberToDelete, setMemberToDelete] = useState<Member | null>(null);
  const [deleteReason, setDeleteReason] = useState<MemberDeleteReason>(
    MEMBER_DELETE_REASONS.FALTA_DE_PAGO,
  );
  const [deleteDetail, setDeleteDetail] = useState("");
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiClient.listMembers({
        page,
        pageSize: 10,
        search: search.trim() || undefined,
        condition: condition || undefined,
        status: status === "" ? undefined : (Number(status) as MemberStatus),
      });
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cargar el listado");
    } finally {
      setLoading(false);
    }
  }, [page, search, condition, status]);

  useEffect(() => {
    void load();
  }, [load]);

  function openDeleteModal(member: Member) {
    if (!isAdmin) return;
    setMemberToDelete(member);
    setDeleteReason(MEMBER_DELETE_REASONS.FALTA_DE_PAGO);
    setDeleteDetail("");
    setError(null);
  }

  function closeDeleteModal() {
    if (deleting) return;
    setMemberToDelete(null);
    setDeleteDetail("");
  }

  async function confirmDelete() {
    if (!isAdmin || !memberToDelete) return;

    if (deleteReason === MEMBER_DELETE_REASONS.OTRA && deleteDetail.trim().length === 0) {
      setError("Indicá el detalle cuando el motivo es Otra");
      return;
    }

    setDeleting(true);
    setError(null);
    try {
      await apiClient.deleteMember(memberToDelete.id, {
        reason: deleteReason,
        detail:
          deleteReason === MEMBER_DELETE_REASONS.OTRA
            ? deleteDetail.trim()
            : deleteDetail.trim() || null,
      });
      setMemberToDelete(null);
      setDeleteDetail("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo eliminar");
    } finally {
      setDeleting(false);
    }
  }

  async function handleRestore(member: Member) {
    if (!isAdmin) return;
    const confirmed = window.confirm(`¿Restablecer a ${member.fullName}? (pasará a Habilitado)`);
    if (!confirmed) return;
    try {
      await apiClient.restoreMember(member.id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo restablecer");
    }
  }

  return (
    <AppShell
      title="Socios"
      actions={
        isAdmin ? (
          <Link className="btn" href="/members/new">
            Nuevo socio
          </Link>
        ) : null
      }
    >
      <section className="card stack">
        <div className="row">
          <div className="field">
            <label htmlFor="search">Búsqueda</label>
            <input
              id="search"
              placeholder="Nombre, email o teléfono"
              value={search}
              onChange={(e) => {
                setPage(1);
                setSearch(e.target.value);
              }}
            />
          </div>
          <div className="field">
            <label htmlFor="condition">Condición</label>
            <select
              id="condition"
              value={condition}
              onChange={(e) => {
                setPage(1);
                setCondition(e.target.value as "" | MemberCondition);
              }}
            >
              <option value="">Todas</option>
              {Object.values(MEMBER_CONDITIONS).map((value) => (
                <option key={value} value={value}>
                  {MEMBER_CONDITION_LABELS[value]}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="status">Estado</label>
            <select
              id="status"
              value={status}
              onChange={(e) => {
                setPage(1);
                setStatus(e.target.value === "" ? "" : Number(e.target.value));
              }}
            >
              <option value="">Todos</option>
              {MEMBER_STATUS_VALUES.map((value) => (
                <option key={value} value={value}>
                  {MEMBER_STATUS_LABELS[value]}
                </option>
              ))}
            </select>
          </div>
        </div>

        {error ? <p className="error">{error}</p> : null}
        {loading ? <p className="muted">Cargando socios...</p> : null}

        {!loading && data ? (
          <>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Email</th>
                    <th>Edad</th>
                    <th>Teléfono</th>
                    <th>Condición</th>
                    <th>Estado</th>
                    {isAdmin ? <th className="col-actions">Acciones</th> : null}
                  </tr>
                </thead>
                <tbody>
                  {data.items.length === 0 ? (
                    <tr>
                      <td colSpan={isAdmin ? 7 : 6} className="muted">
                        No hay socios para mostrar
                      </td>
                    </tr>
                  ) : (
                    data.items.map((member) => {
                      const isDeleted = member.status === MEMBER_STATUS.DELETED;
                      const reasonText = formatDeleteReason(member);
                      return (
                        <tr key={member.id} className={isDeleted ? "row-deleted" : undefined}>
                          <td>{member.fullName}</td>
                          <td>{member.email}</td>
                          <td>{member.age}</td>
                          <td>{member.phone ?? "—"}</td>
                          <td>{MEMBER_CONDITION_LABELS[member.condition]}</td>
                          <td>
                            <span
                              className={statusTextClass(member.status)}
                              title={reasonText ?? undefined}
                            >
                              {getMemberStatusLabel(member.status)}
                              {reasonText ? ` · ${reasonText}` : null}
                            </span>
                          </td>
                          {isAdmin ? (
                            <td className="col-actions">
                              <div className="actions table-actions">
                                {isDeleted ? (
                                  <button
                                    type="button"
                                    className="link-action"
                                    onClick={() => void handleRestore(member)}
                                  >
                                    Restablecer
                                  </button>
                                ) : (
                                  <>
                                    <Link className="link-action" href={`/members/${member.id}`}>
                                      Editar
                                    </Link>
                                    <button
                                      type="button"
                                      className="link-action link-action-danger"
                                      onClick={() => openDeleteModal(member)}
                                    >
                                      Eliminar
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          ) : null}
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="pagination">
              <span className="muted">
                Página {data.page} de {data.totalPages} · {data.total} socios
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

      {memberToDelete ? (
        <div className="modal-root">
          <button
            type="button"
            className="modal-backdrop"
            aria-label="Cerrar diálogo"
            onClick={closeDeleteModal}
            disabled={deleting}
          />
          <div
            className="modal card stack"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-member-title"
          >
            <h2 id="delete-member-title">Eliminar socio</h2>
            <p className="muted">
              ¿Eliminar a <strong>{memberToDelete.fullName}</strong>? Quedará como Eliminado.
            </p>
            <div className="field">
              <label htmlFor="delete-reason">Motivo</label>
              <select
                id="delete-reason"
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value as MemberDeleteReason)}
                disabled={deleting}
              >
                {MEMBER_DELETE_REASON_VALUES.map((value) => (
                  <option key={value} value={value}>
                    {MEMBER_DELETE_REASON_LABELS[value]}
                  </option>
                ))}
              </select>
            </div>
            {deleteReason === MEMBER_DELETE_REASONS.OTRA ? (
              <div className="field">
                <label htmlFor="delete-detail">Detalle</label>
                <textarea
                  id="delete-detail"
                  rows={3}
                  maxLength={MEMBER_DELETE_REASON_DETAIL_MAX_LENGTH}
                  value={deleteDetail}
                  onChange={(e) => setDeleteDetail(e.target.value)}
                  disabled={deleting}
                  placeholder="Explicá el motivo"
                  required
                />
              </div>
            ) : null}
            <div className="actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={closeDeleteModal}
                disabled={deleting}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={() => void confirmDelete()}
                disabled={deleting}
              >
                {deleting ? "Eliminando..." : "Confirmar eliminación"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}
