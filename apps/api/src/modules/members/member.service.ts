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
  isValidMemberBirthDate,
  isValidMemberDeleteReasonDetail,
  isValidMemberDni,
  isValidMemberEmail,
  isValidMemberNamePart,
  isValidOptionalMemberPhone,
  MEMBER_DELETE_REASONS,
  MEMBER_STATUS,
  normalizeMemberBirthDate,
  normalizeMemberDni,
  normalizeMemberEmail,
  normalizeMemberNamePart,
  normalizeOptionalPhone,
} from "@socios/shared";
import { AppError } from "../../lib/errors.js";
import { getLogger } from "../../lib/logger.js";
import { toMemberDto } from "../../lib/mappers.js";
import { prisma } from "../../lib/prisma.js";
import {
  type MemberCreatedSource,
  notifyAdminNewMember,
} from "../../notifications/member-alerts.js";

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 100;

const log = getLogger("members");

export class MemberService {
  async list(query: MemberListQuery): Promise<PaginatedMembers> {
    const page = Math.max(query.page ?? DEFAULT_PAGE, 1);
    const pageSize = Math.min(Math.max(query.pageSize ?? DEFAULT_PAGE_SIZE, 1), MAX_PAGE_SIZE);

    const where: Prisma.MemberWhereInput = {};

    if (query.search?.trim()) {
      const search = query.search.trim();
      const dniSearch = normalizeMemberDni(search);
      where.OR = [
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
        ...(dniSearch.length > 0 ? [{ dni: { contains: dniSearch } }] : []),
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
        orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    log.debug(
      {
        page,
        pageSize,
        total,
        search: query.search?.trim() || undefined,
        condition: query.condition,
        status: query.status,
      },
      "Listed members",
    );

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
      log.warn({ memberId: id }, "Member not found");
      throw new AppError("Member not found", 404, "MEMBER_NOT_FOUND");
    }

    log.debug({ memberId: id }, "Fetched member by id");
    return toMemberDto(member);
  }

  async create(input: CreateMemberRequest, options: { source?: MemberCreatedSource } = {}) {
    this.assertValidStatus(input.status);
    const firstName = this.assertValidNamePart(input.firstName, "first name");
    const lastName = this.assertValidNamePart(input.lastName, "last name");
    const email = this.assertValidEmail(input.email);
    const dni = this.assertValidDni(input.dni);
    const birthDate = this.assertValidBirthDate(input.birthDate);
    const source = options.source ?? "APP";

    const existingByEmail = await prisma.member.findFirst({
      where: { email },
    });

    if (existingByEmail && !existingByEmail.deletedAt) {
      log.warn({ email, source }, "Create member rejected: email taken");
      throw new AppError("Email already in use", 409, "EMAIL_TAKEN");
    }

    const existingByDni = await prisma.member.findFirst({
      where: { dni },
    });

    if (existingByDni && existingByDni.id !== existingByEmail?.id) {
      log.warn({ dni, source }, "Create member rejected: DNI taken");
      throw new AppError("DNI already in use", 409, "DNI_TAKEN");
    }

    if (existingByEmail?.deletedAt) {
      const restored = await prisma.member.update({
        where: { id: existingByEmail.id },
        data: {
          firstName,
          lastName,
          dni,
          birthDate,
          phone: normalizePhone(input.phone),
          condition: input.condition,
          status: input.status,
          deletedAt: null,
          deletedReason: null,
          deletedReasonDetail: null,
        },
      });
      const dto = toMemberDto(restored);
      log.info(
        { memberId: dto.id, email, dni, source, restored: true },
        "Member restored via create (previously deleted)",
      );
      void notifyAdminNewMember(dto, source);
      return dto;
    }

    const member = await prisma.member.create({
      data: {
        firstName,
        lastName,
        email,
        dni,
        birthDate,
        phone: normalizePhone(input.phone),
        condition: input.condition,
        status: input.status,
      },
    });

    const dto = toMemberDto(member);
    log.info(
      { memberId: dto.id, email, dni, source, status: dto.status, condition: dto.condition },
      "Member created",
    );
    void notifyAdminNewMember(dto, source);
    return dto;
  }

  async update(id: string, input: UpdateMemberRequest) {
    const member = await prisma.member.findFirst({
      where: { id, deletedAt: null },
    });

    if (!member) {
      log.warn({ memberId: id }, "Update failed: member not found");
      throw new AppError("Member not found", 404, "MEMBER_NOT_FOUND");
    }

    if (input.status !== undefined) {
      this.assertValidStatus(input.status);
    }

    let dni: string | undefined;
    if (input.dni !== undefined) {
      dni = this.assertValidDni(input.dni);
      const taken = await prisma.member.findFirst({
        where: { dni, NOT: { id } },
      });
      if (taken) {
        log.warn({ memberId: id, dni }, "Update rejected: DNI taken");
        throw new AppError("DNI already in use", 409, "DNI_TAKEN");
      }
    }

    const birthDate =
      input.birthDate !== undefined ? this.assertValidBirthDate(input.birthDate) : undefined;

    const updated = await prisma.member.update({
      where: { id },
      data: {
        firstName:
          input.firstName !== undefined
            ? this.assertValidNamePart(input.firstName, "first name")
            : undefined,
        lastName:
          input.lastName !== undefined
            ? this.assertValidNamePart(input.lastName, "last name")
            : undefined,
        dni,
        birthDate,
        phone: input.phone !== undefined ? normalizePhone(input.phone) : undefined,
        condition: input.condition,
        status: input.status,
      },
    });

    const dto = toMemberDto(updated);
    log.info(
      { memberId: id, status: dto.status, condition: dto.condition, fields: Object.keys(input) },
      "Member updated",
    );
    return dto;
  }

  async softDelete(id: string, input: DeleteMemberRequest): Promise<void> {
    const member = await prisma.member.findUnique({ where: { id } });

    if (!member || member.status === MEMBER_STATUS.DELETED || member.deletedAt !== null) {
      log.warn({ memberId: id }, "Soft delete failed: member not found or already deleted");
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

    log.info({ memberId: id, reason: input.reason }, "Member soft-deleted");
  }

  async restore(id: string) {
    const member = await prisma.member.findUnique({ where: { id } });

    if (!member || (member.status !== MEMBER_STATUS.DELETED && member.deletedAt === null)) {
      log.warn({ memberId: id }, "Restore failed: deleted member not found");
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

    const dto = toMemberDto(restored);
    log.info({ memberId: id }, "Member restored");
    return dto;
  }

  private assertValidStatus(status: number): void {
    if (!isEditableMemberStatus(status)) {
      throw new AppError("Status must be 0, 1 or 2", 400, "INVALID_STATUS");
    }
  }

  private assertValidNamePart(value: string, label: string): string {
    const normalized = normalizeMemberNamePart(value);
    if (!isValidMemberNamePart(normalized)) {
      throw new AppError(`${label} must be between 2 and 60 characters`, 400, "INVALID_NAME_PART");
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

  private assertValidDni(dni: string): string {
    const normalized = normalizeMemberDni(dni);
    if (!isValidMemberDni(normalized)) {
      throw new AppError("DNI must be 7 or 8 digits", 400, "INVALID_DNI");
    }
    return normalized;
  }

  private assertValidBirthDate(value: string): Date {
    const iso = normalizeMemberBirthDate(value);
    if (!iso || !isValidMemberBirthDate(iso)) {
      throw new AppError(
        "Birth date must be a valid date (YYYY-MM-DD or dd/mm/yyyy) with age between 0 and 100",
        400,
        "INVALID_BIRTH_DATE",
      );
    }
    return new Date(`${iso}T00:00:00.000Z`);
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
