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

/** DB / API numeric status: 0 = No Habilitado, 1 = Habilitado, 2 = Pendiente */
export const MEMBER_STATUS = {
  DISABLED: 0,
  ENABLED: 1,
  PENDING: 2,
} as const;

export type MemberStatus = (typeof MEMBER_STATUS)[keyof typeof MEMBER_STATUS];

export const MEMBER_STATUS_LABELS: Record<MemberStatus, string> = {
  [MEMBER_STATUS.DISABLED]: "No Habilitado",
  [MEMBER_STATUS.ENABLED]: "Habilitado",
  [MEMBER_STATUS.PENDING]: "Pendiente",
};

export const MEMBER_STATUS_VALUES: MemberStatus[] = [
  MEMBER_STATUS.DISABLED,
  MEMBER_STATUS.ENABLED,
  MEMBER_STATUS.PENDING,
];

export function isMemberStatus(value: number): value is MemberStatus {
  return MEMBER_STATUS_VALUES.includes(value as MemberStatus);
}

export function getMemberStatusLabel(status: number): string {
  if (!isMemberStatus(status)) {
    return "Desconocido";
  }
  return MEMBER_STATUS_LABELS[status];
}
