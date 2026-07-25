export const USER_ROLES = {
  ADMIN: "ADMIN",
  USER: "USER",
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: "Administrador",
  USER: "Usuario",
};

export const MEMBER_CONDITIONS = {
  SOCIO_REGULAR: "SOCIO_REGULAR",
  ABONADO_TENIS: "ABONADO_TENIS",
} as const;

export type MemberCondition = (typeof MEMBER_CONDITIONS)[keyof typeof MEMBER_CONDITIONS];

export const MEMBER_CONDITION_LABELS: Record<MemberCondition, string> = {
  SOCIO_REGULAR: "Socio Regular",
  ABONADO_TENIS: "Abonado Tenis",
};

/** DB / API numeric status: 0 = No Habilitado, 1 = Habilitado, 2 = Pendiente, 3 = Eliminado */
export const MEMBER_STATUS = {
  DISABLED: 0,
  ENABLED: 1,
  PENDING: 2,
  DELETED: 3,
} as const;

export type MemberStatus = (typeof MEMBER_STATUS)[keyof typeof MEMBER_STATUS];

export const MEMBER_STATUS_LABELS: Record<MemberStatus, string> = {
  [MEMBER_STATUS.DISABLED]: "No Habilitado",
  [MEMBER_STATUS.ENABLED]: "Habilitado",
  [MEMBER_STATUS.PENDING]: "Pendiente",
  [MEMBER_STATUS.DELETED]: "Eliminado",
};

/** All statuses (list filters). */
export const MEMBER_STATUS_VALUES: MemberStatus[] = [
  MEMBER_STATUS.DISABLED,
  MEMBER_STATUS.ENABLED,
  MEMBER_STATUS.PENDING,
  MEMBER_STATUS.DELETED,
];

/** Statuses assignable on create/update (not via soft delete). */
export const MEMBER_EDITABLE_STATUS_VALUES: MemberStatus[] = [
  MEMBER_STATUS.DISABLED,
  MEMBER_STATUS.ENABLED,
  MEMBER_STATUS.PENDING,
];

export function isMemberStatus(value: number): value is MemberStatus {
  return MEMBER_STATUS_VALUES.includes(value as MemberStatus);
}

export function isEditableMemberStatus(value: number): value is MemberStatus {
  return MEMBER_EDITABLE_STATUS_VALUES.includes(value as MemberStatus);
}

export function getMemberStatusLabel(status: number): string {
  if (!isMemberStatus(status)) {
    return "Desconocido";
  }
  return MEMBER_STATUS_LABELS[status];
}

/** Argentine local mobile/landline without leading 0 or 15 — exactly 10 digits when set. */
export const MEMBER_PHONE_LENGTH = 10;
export const MEMBER_PHONE_PATTERN = /^\d{10}$/;

export function normalizeOptionalPhone(phone: string | null | undefined): string | null {
  if (phone === undefined || phone === null) {
    return null;
  }
  const trimmed = phone.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function isValidOptionalMemberPhone(phone: string | null | undefined): boolean {
  const normalized = normalizeOptionalPhone(phone);
  if (normalized === null) {
    return true;
  }
  return MEMBER_PHONE_PATTERN.test(normalized);
}

export const MEMBER_FULL_NAME_MIN_LENGTH = 2;
export const MEMBER_FULL_NAME_MAX_LENGTH = 80;
export const MEMBER_AGE_MIN = 0;
export const MEMBER_AGE_MAX = 100;

/** Practical email check (aligned with common HTML5 / API expectations). */
export const MEMBER_EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeFullName(fullName: string): string {
  return fullName.trim().replace(/\s+/g, " ");
}

export function isValidMemberFullName(fullName: string): boolean {
  const normalized = normalizeFullName(fullName);
  return (
    normalized.length >= MEMBER_FULL_NAME_MIN_LENGTH &&
    normalized.length <= MEMBER_FULL_NAME_MAX_LENGTH
  );
}

export function normalizeMemberEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isValidMemberEmail(email: string): boolean {
  const normalized = normalizeMemberEmail(email);
  return normalized.length > 0 && MEMBER_EMAIL_PATTERN.test(normalized);
}

export function isValidMemberAge(age: number): boolean {
  return Number.isInteger(age) && age >= MEMBER_AGE_MIN && age <= MEMBER_AGE_MAX;
}

export const MEMBER_DELETE_REASONS = {
  FALTA_DE_PAGO: "FALTA_DE_PAGO",
  BAJA_DE_SOCIO: "BAJA_DE_SOCIO",
  OTRA: "OTRA",
} as const;

export type MemberDeleteReason = (typeof MEMBER_DELETE_REASONS)[keyof typeof MEMBER_DELETE_REASONS];

export const MEMBER_DELETE_REASON_LABELS: Record<MemberDeleteReason, string> = {
  [MEMBER_DELETE_REASONS.FALTA_DE_PAGO]: "Falta de pago",
  [MEMBER_DELETE_REASONS.BAJA_DE_SOCIO]: "Baja de socio",
  [MEMBER_DELETE_REASONS.OTRA]: "Otra",
};

export const MEMBER_DELETE_REASON_VALUES: MemberDeleteReason[] = [
  MEMBER_DELETE_REASONS.FALTA_DE_PAGO,
  MEMBER_DELETE_REASONS.BAJA_DE_SOCIO,
  MEMBER_DELETE_REASONS.OTRA,
];

export const MEMBER_DELETE_REASON_DETAIL_MAX_LENGTH = 500;

export function isMemberDeleteReason(value: string): value is MemberDeleteReason {
  return MEMBER_DELETE_REASON_VALUES.includes(value as MemberDeleteReason);
}

export function isValidMemberDeleteReasonDetail(
  reason: MemberDeleteReason,
  detail: string | null | undefined,
): boolean {
  const trimmed = detail?.trim() ?? "";
  if (reason === MEMBER_DELETE_REASONS.OTRA) {
    return trimmed.length > 0 && trimmed.length <= MEMBER_DELETE_REASON_DETAIL_MAX_LENGTH;
  }
  return trimmed.length <= MEMBER_DELETE_REASON_DETAIL_MAX_LENGTH;
}
