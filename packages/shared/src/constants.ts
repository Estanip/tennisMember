export const USER_ROLES = {
  USER: "USER",
  ADMIN: "ADMIN",
  SUPER_ADMIN: "SUPER_ADMIN",
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

export const USER_ROLE_VALUES: UserRole[] = [
  USER_ROLES.USER,
  USER_ROLES.ADMIN,
  USER_ROLES.SUPER_ADMIN,
];

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: "Administrador",
  USER: "Usuario",
  SUPER_ADMIN: "Super administrador",
};

export const USER_PASSWORD_MIN_LENGTH = 8;
export const USER_NAME_MIN_LENGTH = 2;
export const USER_NAME_MAX_LENGTH = 80;

export function isUserRole(value: string): value is UserRole {
  return USER_ROLE_VALUES.includes(value as UserRole);
}

export function canManageMembers(role: UserRole): boolean {
  return role === USER_ROLES.ADMIN || role === USER_ROLES.SUPER_ADMIN;
}

export function canManageUsers(role: UserRole): boolean {
  return role === USER_ROLES.SUPER_ADMIN;
}

export function isValidUserName(name: string): boolean {
  const trimmed = name.trim();
  return trimmed.length >= USER_NAME_MIN_LENGTH && trimmed.length <= USER_NAME_MAX_LENGTH;
}

export function isValidUserPassword(password: string): boolean {
  return password.length >= USER_PASSWORD_MIN_LENGTH;
}

/** Optional login handle: 3–30 chars, starts with letter, lowercase a-z 0-9 . _ - */
export const USER_USERNAME_MIN_LENGTH = 3;
export const USER_USERNAME_MAX_LENGTH = 30;
export const USER_USERNAME_PATTERN = /^[a-z][a-z0-9._-]{2,29}$/;

export function normalizeUsername(value: string): string {
  return value.trim().toLowerCase();
}

export function normalizeOptionalUsername(value: string | null | undefined): string | null {
  if (value === undefined || value === null) {
    return null;
  }
  const normalized = normalizeUsername(value);
  return normalized.length > 0 ? normalized : null;
}

export function isValidUsername(value: string): boolean {
  const normalized = normalizeUsername(value);
  if (normalized.includes("@")) {
    return false;
  }
  return (
    normalized.length >= USER_USERNAME_MIN_LENGTH &&
    normalized.length <= USER_USERNAME_MAX_LENGTH &&
    USER_USERNAME_PATTERN.test(normalized)
  );
}

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

/** External member id from legacy/other DB (free-form string). */
export const MEMBER_EXTERNAL_ID_MAX_LENGTH = 64;

export function normalizeOptionalMemberId(value: string | null | undefined): string | null {
  if (value === undefined || value === null) {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function isValidOptionalMemberId(value: string | null | undefined): boolean {
  const normalized = normalizeOptionalMemberId(value);
  if (normalized === null) {
    return true;
  }
  return normalized.length <= MEMBER_EXTERNAL_ID_MAX_LENGTH;
}

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

export const MEMBER_NAME_PART_MIN_LENGTH = 2;
export const MEMBER_NAME_PART_MAX_LENGTH = 60;
/** @deprecated Use MEMBER_NAME_PART_* */
export const MEMBER_FULL_NAME_MIN_LENGTH = MEMBER_NAME_PART_MIN_LENGTH;
export const MEMBER_FULL_NAME_MAX_LENGTH = 80;
export const MEMBER_AGE_MIN = 0;
export const MEMBER_AGE_MAX = 100;
/** Age under this value is Categoría Menor (menor de 14 años). */
export const MEMBER_MINOR_AGE_THRESHOLD = 14;

export const MEMBER_AGE_CATEGORIES = {
  ADULTO: "ADULTO",
  MENOR: "MENOR",
} as const;

export type MemberAgeCategory = (typeof MEMBER_AGE_CATEGORIES)[keyof typeof MEMBER_AGE_CATEGORIES];

export const MEMBER_AGE_CATEGORY_LABELS: Record<MemberAgeCategory, string> = {
  [MEMBER_AGE_CATEGORIES.ADULTO]: "Adulto",
  [MEMBER_AGE_CATEGORIES.MENOR]: "Menor",
};

/** Practical email check (aligned with common HTML5 / API expectations). */
export const MEMBER_EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeMemberNamePart(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

export function isValidMemberNamePart(value: string): boolean {
  const normalized = normalizeMemberNamePart(value);
  return (
    normalized.length >= MEMBER_NAME_PART_MIN_LENGTH &&
    normalized.length <= MEMBER_NAME_PART_MAX_LENGTH
  );
}

export function formatMemberFullName(firstName: string, lastName: string): string {
  return `${normalizeMemberNamePart(firstName)} ${normalizeMemberNamePart(lastName)}`.trim();
}

/** @deprecated Prefer normalizeMemberNamePart */
export function normalizeFullName(fullName: string): string {
  return normalizeMemberNamePart(fullName);
}

/** @deprecated Prefer isValidMemberNamePart */
export function isValidMemberFullName(fullName: string): boolean {
  const normalized = normalizeMemberNamePart(fullName);
  return normalized.length >= MEMBER_NAME_PART_MIN_LENGTH && normalized.length <= 80;
}

export function normalizeMemberEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isValidMemberEmail(email: string): boolean {
  const normalized = normalizeMemberEmail(email);
  return normalized.length > 0 && MEMBER_EMAIL_PATTERN.test(normalized);
}

/** ISO calendar date YYYY-MM-DD */
export const MEMBER_BIRTH_DATE_ISO_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
/** Argentine form date dd/mm/yyyy */
export const MEMBER_BIRTH_DATE_DMY_PATTERN = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;

function isRealCalendarDate(year: number, month: number, day: number): boolean {
  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return false;
  }
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
  );
}

/** Normalize to ISO YYYY-MM-DD from ISO or dd/mm/yyyy. Returns null if invalid. */
export function normalizeMemberBirthDate(value: string): string | null {
  const trimmed = value.trim();
  if (MEMBER_BIRTH_DATE_ISO_PATTERN.test(trimmed)) {
    const [year, month, day] = trimmed.split("-").map(Number);
    if (!isRealCalendarDate(year, month, day)) {
      return null;
    }
    return trimmed;
  }

  const dmy = trimmed.match(MEMBER_BIRTH_DATE_DMY_PATTERN);
  if (!dmy) {
    return null;
  }
  const day = Number(dmy[1]);
  const month = Number(dmy[2]);
  const year = Number(dmy[3]);
  if (!isRealCalendarDate(year, month, day)) {
    return null;
  }
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function getMemberAge(birthDate: string | Date, asOf: Date = new Date()): number {
  const iso =
    typeof birthDate === "string"
      ? normalizeMemberBirthDate(birthDate)
      : `${birthDate.getUTCFullYear()}-${String(birthDate.getUTCMonth() + 1).padStart(2, "0")}-${String(birthDate.getUTCDate()).padStart(2, "0")}`;

  if (!iso) {
    return Number.NaN;
  }

  const [year, month, day] = iso.split("-").map(Number);
  let age = asOf.getFullYear() - year;
  const monthDiff = asOf.getMonth() + 1 - month;
  const dayDiff = asOf.getDate() - day;
  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
    age -= 1;
  }
  return age;
}

export function isValidMemberBirthDate(value: string, asOf: Date = new Date()): boolean {
  const iso = normalizeMemberBirthDate(value);
  if (!iso) {
    return false;
  }
  const age = getMemberAge(iso, asOf);
  return Number.isInteger(age) && age >= MEMBER_AGE_MIN && age <= MEMBER_AGE_MAX;
}

export function getMemberAgeCategory(age: number): MemberAgeCategory {
  return age < MEMBER_MINOR_AGE_THRESHOLD
    ? MEMBER_AGE_CATEGORIES.MENOR
    : MEMBER_AGE_CATEGORIES.ADULTO;
}

export function getMemberAgeCategoryLabel(age: number): string {
  return MEMBER_AGE_CATEGORY_LABELS[getMemberAgeCategory(age)];
}

/** @deprecated Prefer birthDate + getMemberAge. Kept for transitional checks. */
export function isValidMemberAge(age: number): boolean {
  return Number.isInteger(age) && age >= MEMBER_AGE_MIN && age <= MEMBER_AGE_MAX;
}

/** Argentine DNI: 7–8 digits. Normalize by stripping non-digits (dots, spaces, dashes). */
export const MEMBER_DNI_MIN_LENGTH = 7;
export const MEMBER_DNI_MAX_LENGTH = 8;
export const MEMBER_DNI_PATTERN = /^\d{7,8}$/;

export function normalizeMemberDni(dni: string): string {
  return dni.replace(/\D/g, "");
}

export function isValidMemberDni(dni: string): boolean {
  return MEMBER_DNI_PATTERN.test(normalizeMemberDni(dni));
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
