import type { MemberCondition, Prisma } from "@prisma/client";
import type {
  CreateMemberRequest,
  MemberListQuery,
  PaginatedMembers,
  UpdateMemberRequest,
} from "@socios/shared";
import { isMemberStatus, MEMBER_STATUS } from "@socios/shared";
import { AppError } from "../../lib/errors.js";
import { toMemberDto } from "../../lib/mappers.js";
import { prisma } from "../../lib/prisma.js";

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 100;

export class MemberService {
  async list(query: MemberListQuery): Promise<PaginatedMembers> {
    const page = Math.max(query.page ?? DEFAULT_PAGE, 1);
    const pageSize = Math.min(Math.max(query.pageSize ?? DEFAULT_PAGE_SIZE, 1), MAX_PAGE_SIZE);

    const where: Prisma.MemberWhereInput = {
      deletedAt: null,
    };

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

  async create(input: CreateMemberRequest) {
    this.assertValidStatus(input.status);
    this.assertValidAge(input.age);

    const existing = await prisma.member.findFirst({
      where: { email: input.email.toLowerCase() },
    });

    if (existing && !existing.deletedAt) {
      throw new AppError("Email already in use", 409, "EMAIL_TAKEN");
    }

    if (existing?.deletedAt) {
      const restored = await prisma.member.update({
        where: { id: existing.id },
        data: {
          fullName: input.fullName.trim(),
          age: input.age,
          phone: normalizePhone(input.phone),
          condition: input.condition,
          status: input.status,
          deletedAt: null,
        },
      });
      return toMemberDto(restored);
    }

    const member = await prisma.member.create({
      data: {
        fullName: input.fullName.trim(),
        email: input.email.toLowerCase().trim(),
        age: input.age,
        phone: normalizePhone(input.phone),
        condition: input.condition,
        status: input.status,
      },
    });

    return toMemberDto(member);
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
        fullName: input.fullName?.trim(),
        age: input.age,
        phone: input.phone !== undefined ? normalizePhone(input.phone) : undefined,
        condition: input.condition,
        status: input.status,
      },
    });

    return toMemberDto(updated);
  }

  async softDelete(id: string): Promise<void> {
    const member = await prisma.member.findFirst({
      where: { id, deletedAt: null },
    });

    if (!member) {
      throw new AppError("Member not found", 404, "MEMBER_NOT_FOUND");
    }

    await prisma.member.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        status: MEMBER_STATUS.DISABLED,
      },
    });
  }

  private assertValidStatus(status: number): void {
    if (!isMemberStatus(status)) {
      throw new AppError("Status must be 0, 1 or 2", 400, "INVALID_STATUS");
    }
  }

  private assertValidAge(age: number): void {
    if (!Number.isInteger(age) || age < 0 || age > 120) {
      throw new AppError("Age must be an integer between 0 and 120", 400, "INVALID_AGE");
    }
  }
}

function normalizePhone(phone: string | null | undefined): string | null {
  if (phone === undefined || phone === null) {
    return null;
  }
  const trimmed = phone.trim();
  return trimmed.length > 0 ? trimmed : null;
}
