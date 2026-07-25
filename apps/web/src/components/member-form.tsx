"use client";

import type { CreateMemberRequest, MemberCondition, MemberStatus } from "@socios/shared";
import {
  isValidMemberAge,
  isValidMemberEmail,
  isValidMemberFullName,
  isValidOptionalMemberPhone,
  MEMBER_AGE_MAX,
  MEMBER_AGE_MIN,
  MEMBER_CONDITION_LABELS,
  MEMBER_CONDITIONS,
  MEMBER_EDITABLE_STATUS_VALUES,
  MEMBER_FULL_NAME_MAX_LENGTH,
  MEMBER_FULL_NAME_MIN_LENGTH,
  MEMBER_PHONE_LENGTH,
  MEMBER_STATUS,
  MEMBER_STATUS_LABELS,
  normalizeFullName,
  normalizeMemberEmail,
  normalizeOptionalPhone,
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

    const normalizedName = normalizeFullName(fullName);
    if (!isValidMemberFullName(normalizedName)) {
      setError(
        `El nombre completo debe tener entre ${MEMBER_FULL_NAME_MIN_LENGTH} y ${MEMBER_FULL_NAME_MAX_LENGTH} caracteres`,
      );
      setSubmitting(false);
      return;
    }

    const normalizedEmail = normalizeMemberEmail(email);
    if (!isValidMemberEmail(normalizedEmail)) {
      setError("Ingresá un email válido");
      setSubmitting(false);
      return;
    }

    const parsedAge = Number(age);
    if (!isValidMemberAge(parsedAge)) {
      setError(`La edad debe ser un número entero entre ${MEMBER_AGE_MIN} y ${MEMBER_AGE_MAX}`);
      setSubmitting(false);
      return;
    }

    const normalizedPhone = normalizeOptionalPhone(phone);
    if (!isValidOptionalMemberPhone(normalizedPhone)) {
      setError(
        `El teléfono, si se carga, debe tener exactamente ${MEMBER_PHONE_LENGTH} dígitos (sin el 0 y sin el 15)`,
      );
      setSubmitting(false);
      return;
    }

    try {
      await onSubmit({
        fullName: normalizedName,
        email: normalizedEmail,
        age: parsedAge,
        phone: normalizedPhone,
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
    <form className="card stack" onSubmit={handleSubmit} noValidate>
      <div className="row">
        <div className="field">
          <label htmlFor="fullName">Nombre completo</label>
          <input
            id="fullName"
            value={fullName}
            onChange={(e) => setFullName(e.target.value.slice(0, MEMBER_FULL_NAME_MAX_LENGTH))}
            required
            minLength={MEMBER_FULL_NAME_MIN_LENGTH}
            maxLength={MEMBER_FULL_NAME_MAX_LENGTH}
            autoComplete="name"
          />
        </div>
        <div className="field">
          <label htmlFor="email">{emailReadOnly ? "Email (no editable)" : "Email"}</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            readOnly={emailReadOnly}
            disabled={emailReadOnly}
            autoComplete="email"
          />
        </div>
      </div>
      <div className="row">
        <div className="field">
          <label htmlFor="age">Edad</label>
          <input
            id="age"
            type="number"
            min={MEMBER_AGE_MIN}
            max={MEMBER_AGE_MAX}
            step={1}
            value={age}
            onChange={(e) => setAge(e.target.value)}
            required
          />
        </div>
        <div className="field">
          <label htmlFor="phone">Teléfono (sin el 0 y sin el 15)</label>
          <input
            id="phone"
            inputMode="numeric"
            autoComplete="tel-national"
            maxLength={MEMBER_PHONE_LENGTH}
            pattern={`\\d{${MEMBER_PHONE_LENGTH}}`}
            title={`Opcional. Si se carga, exactamente ${MEMBER_PHONE_LENGTH} dígitos sin 0 ni 15`}
            placeholder="Ej: 2914123456"
            value={phone}
            onChange={(e) =>
              setPhone(e.target.value.replace(/\D/g, "").slice(0, MEMBER_PHONE_LENGTH))
            }
          />
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
            {MEMBER_EDITABLE_STATUS_VALUES.map((value) => (
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
