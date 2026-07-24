import type { MemberCondition, MemberStatus, UserRole } from "./constants.js";

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
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: AuthUser;
}

export interface Member {
  id: string;
  fullName: string;
  email: string;
  age: number;
  phone: string | null;
  condition: MemberCondition;
  status: MemberStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMemberRequest {
  fullName: string;
  email: string;
  age: number;
  phone?: string | null;
  condition: MemberCondition;
  status: MemberStatus;
}

export interface UpdateMemberRequest {
  fullName?: string;
  age?: number;
  phone?: string | null;
  condition?: MemberCondition;
  status?: MemberStatus;
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
  fullName: string;
  age: number;
  phone: string;
}

export interface PaginatedMembers {
  items: Member[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
