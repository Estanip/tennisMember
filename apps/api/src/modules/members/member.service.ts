import type { MemberCondition, Prisma } from "@prisma/client";
import type {
  CreateMemberRequest,
  DeleteMemberRequest,
  MemberListQuery,
  PaginatedMembers,
  UpdateMemberRequest,
} from "@socios/shared";
import {
  isEditableMemberStatus,
  isMemberDeleteReason,
  isMemberStatus,
  isValidMemberAge,
  isValidMemberDeleteReasonDetail,
  isValidMemberEmail,
  isValidMemberFullName,
  isValidOptionalMemberPhone,
  MEMBER_DELETE_REASONS,
  MEMBER_STATUS,
  normalizeFullName,
  normalizeMemberEmail,
  normalizeOptionalPhone,
} from "@socios/shared";
import { AppError } from "../../lib/errors.js";
import { toMemberDto } from "../../lib/mappers.js";
import { prisma } from "../../lib/prisma.js";
import {
  type MemberCreatedSource,
  notifyAdminNewMember,
} from "../../notifications/member-alerts.js";

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 100;

export class MemberService {
  async list(query: MemberListQuery): Promise<PaginatedMembers> {
    const page = Math.max(query.page ?? DEFAULT_PAGE, 1);
    const pageSize = Math.min(Math.max(query.pageSize ?? DEFAULT_PAGE_SIZE, 1), MAX_PAGE_SIZE);

    const where: Prisma.MemberWhereInput = {};

    if (query.search?.trim()) {
      const search = query.search.trim();
      where.OR = [
        { fullName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
      ];
    }

    if (query.condition) {
      where.condition = query.condition as MemberCondition;
    }

    if (query.status !== undefined) {
      if (!isMemberStatus(query.status)) {
        throw new AppError("Invalid status filter", 400, "INVALID_STATUS");
      }
      where.status = query.status;
    }

    const [total, items] = await prisma.$transaction([
      prisma.member.count({ where }),
      prisma.member.findMany({
        where,
        orderBy: { fullName: "asc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return {
      items: items.map(toMemberDto),
      total,
      page,
      pageSize,
      totalPages: Math.max(Math.ceil(total / pageSize), 1),
    };
  }

  async getById(id: string) {
    const member = await prisma.member.findFirst({
      where: { id, deletedAt: null },
    });

    if (!member) {
      throw new AppError("Member not found", 404, "MEMBER_NOT_FOUND");
    }

    return toMemberDto(member);
  }

  async create(input: CreateMemberRequest, options: { source?: MemberCreatedSource } = {}) {
    this.assertValidStatus(input.status);
    this.assertValidAge(input.age);
    const fullName = this.assertValidFullName(input.fullName);
    const email = this.assertValidEmail(input.email);
    const source = options.source ?? "APP";

    const existing = await prisma.member.findFirst({
      where: { email },
    });

    if (existing && !existing.deletedAt) {
      throw new AppError("Email already in use", 409, "EMAIL_TAKEN");
    }

    if (existing?.deletedAt) {
      const restored = await prisma.member.update({
        where: { id: existing.id },
        data: {
          fullName,
          age: input.age,
          phone: normalizePhone(input.phone),
          condition: input.condition,
          status: input.status,
          deletedAt: null,
          deletedReason: null,
          deletedReasonDetail: null,
        },
      });
      const dto = toMemberDto(restored);
      await notifyAdminNewMember(dto, source);
      return dto;
    }

    const member = await prisma.member.create({
      data: {
        fullName,
        email,
        age: input.age,
        phone: normalizePhone(input.phone),
        condition: input.condition,
        status: input.status,
      },
    });

    const dto = toMemberDto(member);
    await notifyAdminNewMember(dto, source);
    return dto;
  }

  async update(id: string, input: UpdateMemberRequest) {
    const member = await prisma.member.findFirst({
      where: { id, deletedAt: null },
    });

    if (!member) {
      throw new AppError("Member not found", 404, "MEMBER_NOT_FOUND");
    }

    if (input.status !== undefined) {
      this.assertValidStatus(input.status);
    }

    if (input.age !== undefined) {
      this.assertValidAge(input.age);
    }

    const updated = await prisma.member.update({
      where: { id },
      data: {
        fullName:
          input.fullName !== undefined ? this.assertValidFullName(input.fullName) : undefined,
        age: input.age,
        phone: input.phone !== undefined ? normalizePhone(input.phone) : undefined,
        condition: input.condition,
        status: input.status,
      },
    });

    return toMemberDto(updated);
  }

  async softDelete(id: string, input: DeleteMemberRequest): Promise<void> {
    const member = await prisma.member.findUnique({ where: { id } });

    if (!member || member.status === MEMBER_STATUS.DELETED || member.deletedAt !== null) {
      throw new AppError("Member not found", 404, "MEMBER_NOT_FOUND");
    }

    if (!isMemberDeleteReason(input.reason)) {
      throw new AppError("Invalid delete reason", 400, "INVALID_DELETE_REASON");
    }

    const detail = input.detail?.trim() || null;
    if (!isValidMemberDeleteReasonDetail(input.reason, detail)) {
      throw new AppError(
        input.reason === MEMBER_DELETE_REASONS.OTRA
          ? "Detail is required when reason is OTRA"
          : "Delete reason detail is too long",
        400,
        "INVALID_DELETE_REASON_DETAIL",
      );
    }

    await prisma.member.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        status: MEMBER_STATUS.DELETED,
        deletedReason: input.reason,
        deletedReasonDetail: input.reason === MEMBER_DELETE_REASONS.OTRA ? detail : detail || null,
      },
    });
  }

  async restore(id: string) {
    const member = await prisma.member.findUnique({ where: { id } });

    if (!member || (member.status !== MEMBER_STATUS.DELETED && member.deletedAt === null)) {
      throw new AppError("Deleted member not found", 404, "MEMBER_NOT_FOUND");
    }

    const restored = await prisma.member.update({
      where: { id },
      data: {
        deletedAt: null,
        status: MEMBER_STATUS.ENABLED,
        deletedReason: null,
        deletedReasonDetail: null,
      },
    });

    return toMemberDto(restored);
  }

  private assertValidStatus(status: number): void {
    if (!isEditableMemberStatus(status)) {
      throw new AppError("Status must be 0, 1 or 2", 400, "INVALID_STATUS");
    }
  }

  private assertValidAge(age: number): void {
    if (!isValidMemberAge(age)) {
      throw new AppError("Age must be an integer between 0 and 100", 400, "INVALID_AGE");
    }
  }

  private assertValidFullName(fullName: string): string {
    const normalized = normalizeFullName(fullName);
    if (!isValidMemberFullName(normalized)) {
      throw new AppError("Full name must be between 2 and 80 characters", 400, "INVALID_FULL_NAME");
    }
    return normalized;
  }

  private assertValidEmail(email: string): string {
    const normalized = normalizeMemberEmail(email);
    if (!isValidMemberEmail(normalized)) {
      throw new AppError("Invalid email address", 400, "INVALID_EMAIL");
    }
    return normalized;
  }
}

function normalizePhone(phone: string | null | undefined): string | null {
  const normalized = normalizeOptionalPhone(phone);
  if (!isValidOptionalMemberPhone(normalized)) {
    throw new AppError(
      "Phone must be exactly 10 digits (without leading 0 or 15), or empty",
      400,
      "INVALID_PHONE",
    );
  }
  return normalized;
}
