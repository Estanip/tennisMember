"use client";

import type { CreateMemberRequest, MemberCondition, MemberStatus } from "@socios/shared";
import {
  isValidMemberBirthDate,
  isValidMemberDni,
  isValidMemberNamePart,
  isValidOptionalMemberEmail,
  isValidOptionalMemberId,
  isValidOptionalMemberPhone,
  MEMBER_CONDITION_LABELS,
  MEMBER_CONDITIONS,
  MEMBER_DNI_MAX_LENGTH,
  MEMBER_EDITABLE_STATUS_VALUES,
  MEMBER_EXTERNAL_ID_MAX_LENGTH,
  MEMBER_NAME_PART_MAX_LENGTH,
  MEMBER_NAME_PART_MIN_LENGTH,
  MEMBER_PHONE_LENGTH,
  MEMBER_STATUS,
  MEMBER_STATUS_LABELS,
  normalizeMemberBirthDate,
  normalizeMemberDni,
  normalizeMemberNamePart,
  normalizeOptionalMemberEmail,
  normalizeOptionalMemberId,
  normalizeOptionalPhone,
} from "@socios/shared";
import { type FormEvent, useState } from "react";

interface MemberFormProps {
  initial?: Partial<CreateMemberRequest> & {
    email?: string | null;
    dni?: string;
    birthDate?: string;
    firstName?: string;
    lastName?: string;
    memberId?: string | null;
  };
  /** When true, email field is read-only (existing email locked for non-super-admin). */
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
  const [firstName, setFirstName] = useState(initial?.firstName ?? "");
  const [lastName, setLastName] = useState(initial?.lastName ?? "");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [dni, setDni] = useState(initial?.dni ?? "");
  const [birthDate, setBirthDate] = useState(initial?.birthDate ?? "");
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [memberId, setMemberId] = useState(initial?.memberId ?? "");
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

    const normalizedFirstName = normalizeMemberNamePart(firstName);
    if (!isValidMemberNamePart(normalizedFirstName)) {
      setError(
        `El nombre debe tener entre ${MEMBER_NAME_PART_MIN_LENGTH} y ${MEMBER_NAME_PART_MAX_LENGTH} caracteres`,
      );
      setSubmitting(false);
      return;
    }

    const normalizedLastName = normalizeMemberNamePart(lastName);
    if (!isValidMemberNamePart(normalizedLastName)) {
      setError(
        `El apellido debe tener entre ${MEMBER_NAME_PART_MIN_LENGTH} y ${MEMBER_NAME_PART_MAX_LENGTH} caracteres`,
      );
      setSubmitting(false);
      return;
    }

    const normalizedEmail = normalizeOptionalMemberEmail(email);
    if (!isValidOptionalMemberEmail(normalizedEmail)) {
      setError("Ingresá un email válido o dejalo vacío");
      setSubmitting(false);
      return;
    }

    const normalizedDni = normalizeMemberDni(dni);
    if (!isValidMemberDni(normalizedDni)) {
      setError("El DNI debe tener 7 u 8 dígitos");
      setSubmitting(false);
      return;
    }

    const normalizedBirthDate = normalizeMemberBirthDate(birthDate);
    if (!normalizedBirthDate || !isValidMemberBirthDate(normalizedBirthDate)) {
      setError("Ingresá una fecha de nacimiento válida (edad entre 0 y 100)");
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

    const normalizedMemberId = normalizeOptionalMemberId(memberId);
    if (!isValidOptionalMemberId(normalizedMemberId)) {
      setError(`El Nro. Socio no puede superar ${MEMBER_EXTERNAL_ID_MAX_LENGTH} caracteres`);
      setSubmitting(false);
      return;
    }

    try {
      await onSubmit({
        firstName: normalizedFirstName,
        lastName: normalizedLastName,
        email: normalizedEmail,
        dni: normalizedDni,
        birthDate: normalizedBirthDate,
        phone: normalizedPhone,
        memberId: normalizedMemberId,
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
          <label htmlFor="firstName">Nombre</label>
          <input
            id="firstName"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value.slice(0, MEMBER_NAME_PART_MAX_LENGTH))}
            required
            minLength={MEMBER_NAME_PART_MIN_LENGTH}
            maxLength={MEMBER_NAME_PART_MAX_LENGTH}
            autoComplete="given-name"
          />
        </div>
        <div className="field">
          <label htmlFor="lastName">Apellido</label>
          <input
            id="lastName"
            value={lastName}
            onChange={(e) => setLastName(e.target.value.slice(0, MEMBER_NAME_PART_MAX_LENGTH))}
            required
            minLength={MEMBER_NAME_PART_MIN_LENGTH}
            maxLength={MEMBER_NAME_PART_MAX_LENGTH}
            autoComplete="family-name"
          />
        </div>
      </div>
      <div className="row">
        <div className="field">
          <label htmlFor="email">
            {emailReadOnly ? "Email (solo super admin puede modificarlo)" : "Email (opcional)"}
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            readOnly={emailReadOnly}
            disabled={emailReadOnly}
            autoComplete="email"
            placeholder={emailReadOnly ? undefined : "Puede quedar vacío"}
          />
          {emailReadOnly ? (
            <p className="muted">Para cambiar o vaciar este email hace falta un super admin.</p>
          ) : null}
        </div>
        <div className="field">
          <label htmlFor="dni">DNI</label>
          <input
            id="dni"
            inputMode="numeric"
            autoComplete="off"
            maxLength={MEMBER_DNI_MAX_LENGTH}
            pattern={`\\d{7,8}`}
            title="7 u 8 dígitos, sin puntos"
            placeholder="Ej: 30123456"
            value={dni}
            onChange={(e) =>
              setDni(e.target.value.replace(/\D/g, "").slice(0, MEMBER_DNI_MAX_LENGTH))
            }
            required
          />
        </div>
      </div>
      <div className="row">
        <div className="field">
          <label htmlFor="birthDate">Fecha de nacimiento</label>
          <input
            id="birthDate"
            type="date"
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
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
      <div className="field">
        <label htmlFor="memberId">Nro. Socio (opcional)</label>
        <input
          id="memberId"
          value={memberId}
          onChange={(e) => setMemberId(e.target.value.slice(0, MEMBER_EXTERNAL_ID_MAX_LENGTH))}
          maxLength={MEMBER_EXTERNAL_ID_MAX_LENGTH}
          autoComplete="off"
          placeholder="Número de socio en el sistema legado"
        />
        <p className="muted">
          Referencia única al nro. de socio en otra base (máx. {MEMBER_EXTERNAL_ID_MAX_LENGTH})
        </p>
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
