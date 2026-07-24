"use client";

import type { CreateMemberRequest, MemberCondition, MemberStatus } from "@socios/shared";
import {
  MEMBER_CONDITION_LABELS,
  MEMBER_CONDITIONS,
  MEMBER_STATUS,
  MEMBER_STATUS_LABELS,
  MEMBER_STATUS_VALUES,
} from "@socios/shared";
import { type FormEvent, useState } from "react";

interface MemberFormProps {
  initial?: Partial<CreateMemberRequest> & { email?: string };
  emailReadOnly?: boolean;
  submitLabel: string;
  onSubmit: (values: CreateMemberRequest) => Promise<void>;
}

export function MemberForm({
  initial,
  emailReadOnly = false,
  submitLabel,
  onSubmit,
}: MemberFormProps) {
  const [fullName, setFullName] = useState(initial?.fullName ?? "");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [age, setAge] = useState(String(initial?.age ?? ""));
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [condition, setCondition] = useState<MemberCondition>(
    initial?.condition ?? MEMBER_CONDITIONS.SOCIO_REGULAR,
  );
  const [status, setStatus] = useState<MemberStatus>(initial?.status ?? MEMBER_STATUS.ENABLED);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const parsedAge = Number(age);
    if (!Number.isInteger(parsedAge)) {
      setError("La edad debe ser un número entero");
      setSubmitting(false);
      return;
    }

    try {
      await onSubmit({
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        age: parsedAge,
        phone: phone.trim() ? phone.trim() : null,
        condition,
        status,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="card stack" onSubmit={handleSubmit}>
      <div className="row">
        <div className="field">
          <label htmlFor="fullName">Nombre completo</label>
          <input
            id="fullName"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
        </div>
        <div className="field">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            readOnly={emailReadOnly}
            disabled={emailReadOnly}
          />
        </div>
      </div>
      <div className="row">
        <div className="field">
          <label htmlFor="age">Edad</label>
          <input
            id="age"
            type="number"
            min={0}
            max={120}
            value={age}
            onChange={(e) => setAge(e.target.value)}
            required
          />
        </div>
        <div className="field">
          <label htmlFor="phone">Teléfono (opcional)</label>
          <input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
      </div>
      <div className="row">
        <div className="field">
          <label htmlFor="condition">Condición</label>
          <select
            id="condition"
            value={condition}
            onChange={(e) => setCondition(e.target.value as MemberCondition)}
          >
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
            onChange={(e) => setStatus(Number(e.target.value) as MemberStatus)}
          >
            {MEMBER_STATUS_VALUES.map((value) => (
              <option key={value} value={value}>
                {MEMBER_STATUS_LABELS[value]}
              </option>
            ))}
          </select>
        </div>
      </div>
      {error ? <p className="error">{error}</p> : null}
      <button className="btn" type="submit" disabled={submitting}>
        {submitting ? "Guardando..." : submitLabel}
      </button>
    </form>
  );
}
