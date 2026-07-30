import type {
  MemberAgeCategory,
  MemberCondition,
  MemberDeleteReason,
  MemberStatus,
  UserRole,
} from "./constants.js";

export interface ApiSuccessResponse<T = unknown> {
  success: true;
  data?: T;
  message?: string;
}

export interface ApiErrorResponse {
  success: false;
  error?: string;
  message?: string;
}

export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

export interface LoginRequest {
  /** Email or username */
  identifier: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: AuthUser;
}

export interface Member {
  id: string;
  /** External id from legacy/other DB; unique when set */
  memberId: string | null;
  firstName: string;
  lastName: string;
  /** Derived: "{firstName} {lastName}" */
  fullName: string;
  /** Optional; unique when set */
  email: string | null;
  dni: string;
  /** ISO calendar date YYYY-MM-DD */
  birthDate: string;
  /** Derived from birthDate at response time */
  age: number;
  /** Derived from age; not persisted */
  ageCategory: MemberAgeCategory;
  phone: string | null;
  condition: MemberCondition;
  status: MemberStatus;
  deletedReason: MemberDeleteReason | null;
  deletedReasonDetail: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMemberRequest {
  firstName: string;
  lastName: string;
  /** Optional; unique when set */
  email?: string | null;
  dni: string;
  /** ISO YYYY-MM-DD or dd/mm/yyyy */
  birthDate: string;
  phone?: string | null;
  /** External id; optional and unique when set */
  memberId?: string | null;
  condition: MemberCondition;
  status: MemberStatus;
}

export interface UpdateMemberRequest {
  firstName?: string;
  lastName?: string;
  /** Optional; unique when set; editable after create */
  email?: string | null;
  dni?: string;
  /** ISO YYYY-MM-DD or dd/mm/yyyy */
  birthDate?: string;
  phone?: string | null;
  /** External id; optional and unique when set */
  memberId?: string | null;
  condition?: MemberCondition;
  status?: MemberStatus;
}

export interface DeleteMemberRequest {
  reason: MemberDeleteReason;
  detail?: string | null;
}

export interface MemberListQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  condition?: MemberCondition;
  status?: MemberStatus;
}

export interface GoogleFormMemberPayload {
  email: string;
  firstName: string;
  lastName: string;
  dni: string;
  /** Expected as dd/mm/yyyy from the form */
  birthDate: string;
  phone: string;
}

export interface PaginatedMembers {
  items: Member[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface MemberImportRowIdentity {
  row: number;
  firstName?: string;
  lastName?: string;
  email?: string;
  dni?: string;
  memberId?: string | null;
}

export interface MemberImportSkippedRow extends MemberImportRowIdentity {
  reason: string;
}

export interface MemberImportResult {
  created: number;
  restored: number;
  skipped: MemberImportSkippedRow[];
  restoredRows: MemberImportRowIdentity[];
}

export interface BackofficeUser {
  id: string;
  email: string;
  username: string | null;
  name: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserRequest {
  email: string;
  username?: string | null;
  name: string;
  password: string;
  role: UserRole;
}

export interface UpdateUserRequest {
  name?: string;
  username?: string | null;
  password?: string;
  role?: UserRole;
}

export interface UserListQuery {
  page?: number;
  pageSize?: number;
  search?: string;
}

export interface PaginatedUsers {
  items: BackofficeUser[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
