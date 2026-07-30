import type { MemberCondition, Prisma } from "@prisma/client";
import type {
  CreateMemberRequest,
  DeleteMemberRequest,
  MemberImportResult,
  MemberImportRowIdentity,
  MemberImportSkippedRow,
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
  isValidMemberNamePart,
  isValidOptionalMemberEmail,
  isValidOptionalMemberId,
  isValidOptionalMemberPhone,
  MEMBER_DELETE_REASONS,
  MEMBER_EXCEL_HEADERS,
  MEMBER_EXTERNAL_ID_MAX_LENGTH,
  MEMBER_STATUS,
  normalizeMemberBirthDate,
  normalizeMemberDni,
  normalizeMemberNamePart,
  normalizeOptionalMemberEmail,
  normalizeOptionalMemberId,
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
import {
  buildMembersWorkbook,
  type ParsedMemberImportRow,
  parseMembersImportWorkbook,
} from "./member-excel.js";

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 100;
const MAX_EXPORT_ROWS = 10_000;

const log = getLogger("members");

export class MemberService {
  async list(query: MemberListQuery): Promise<PaginatedMembers> {
    const page = Math.max(query.page ?? DEFAULT_PAGE, 1);
    const pageSize = Math.min(Math.max(query.pageSize ?? DEFAULT_PAGE_SIZE, 1), MAX_PAGE_SIZE);
    const where = this.buildListWhere(query);

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

  async exportWorkbook(query: MemberListQuery): Promise<Buffer> {
    const where = this.buildListWhere(query);
    const items = await prisma.member.findMany({
      where,
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      take: MAX_EXPORT_ROWS,
    });
    log.info({ total: items.length, search: query.search }, "Exporting members workbook");
    return buildMembersWorkbook(items.map(toMemberDto));
  }

  async importTemplateWorkbook(): Promise<Buffer> {
    return buildMembersWorkbook([], { includeExampleRow: true });
  }

  async importFromExcel(buffer: Buffer): Promise<MemberImportResult> {
    const parsedRows = await parseMembersImportWorkbook(buffer);
    const skipped: MemberImportSkippedRow[] = [];
    const restoredRows: MemberImportRowIdentity[] = [];
    let created = 0;
    let restored = 0;

    for (const parsed of parsedRows) {
      if ("error" in parsed) {
        skipped.push({
          row: parsed.row,
          reason: parsed.error,
          firstName: parsed.raw[MEMBER_EXCEL_HEADERS.firstName] || undefined,
          lastName: parsed.raw[MEMBER_EXCEL_HEADERS.lastName] || undefined,
          email: parsed.raw[MEMBER_EXCEL_HEADERS.email] || undefined,
          dni: parsed.raw[MEMBER_EXCEL_HEADERS.dni] || undefined,
          memberId: parsed.raw[MEMBER_EXCEL_HEADERS.memberId] || null,
        });
        continue;
      }

      const identity = this.rowIdentity(parsed);
      try {
        const outcome = await this.importOneRow(parsed);
        if (outcome === "created") {
          created += 1;
        } else if (outcome === "restored") {
          restored += 1;
          restoredRows.push(identity);
        }
      } catch (err) {
        const reason = err instanceof AppError ? err.message : "No se pudo importar la fila";
        skipped.push({ ...identity, reason });
      }
    }

    log.info({ created, restored, skipped: skipped.length }, "Member Excel import finished");

    return { created, restored, skipped, restoredRows };
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

  async create(
    input: CreateMemberRequest,
    options: { source?: MemberCreatedSource; notify?: boolean } = {},
  ) {
    this.assertValidStatus(input.status);
    const firstName = this.assertValidNamePart(input.firstName, "first name");
    const lastName = this.assertValidNamePart(input.lastName, "last name");
    const email = this.resolveOptionalEmail(input.email);
    const dni = this.assertValidDni(input.dni);
    const birthDate = this.assertValidBirthDate(input.birthDate);
    const memberId = this.resolveMemberId(input.memberId);
    const phone = normalizePhone(input.phone);
    const source = options.source ?? "APP";
    const notify = options.notify !== false;

    const existingByEmail = email ? await prisma.member.findFirst({ where: { email } }) : null;

    if (existingByEmail && !existingByEmail.deletedAt) {
      log.warn({ email, source }, "Create member rejected: email taken");
      throw new AppError("Email already in use", 409, "EMAIL_TAKEN");
    }

    const existingByDni = await prisma.member.findFirst({
      where: { dni },
    });

    if (existingByDni && !existingByDni.deletedAt) {
      if (!existingByEmail || existingByDni.id !== existingByEmail.id) {
        log.warn({ dni, source }, "Create member rejected: DNI taken");
        throw new AppError("DNI already in use", 409, "DNI_TAKEN");
      }
    }

    const restoreTarget = existingByEmail?.deletedAt
      ? existingByEmail
      : existingByDni?.deletedAt
        ? existingByDni
        : null;

    if (
      existingByEmail?.deletedAt &&
      existingByDni?.deletedAt &&
      existingByEmail.id !== existingByDni.id
    ) {
      log.warn({ email, dni, source }, "Create member rejected: deleted email/DNI conflict");
      throw new AppError(
        "Email and DNI match different deleted members",
        409,
        "CREATE_DELETED_CONFLICT",
      );
    }

    await this.assertMemberIdAvailable(memberId, restoreTarget?.id);

    if (restoreTarget) {
      const restored = await prisma.member.update({
        where: { id: restoreTarget.id },
        data: {
          firstName,
          lastName,
          email,
          dni,
          birthDate,
          phone,
          memberId,
          condition: input.condition,
          status: input.status,
          deletedAt: null,
          deletedReason: null,
          deletedReasonDetail: null,
        },
      });
      const dto = toMemberDto(restored);
      log.info(
        { memberId: dto.id, externalMemberId: memberId, email, dni, source, restored: true },
        "Member restored via create (previously deleted)",
      );
      if (notify) {
        void notifyAdminNewMember(dto, source);
      }
      return dto;
    }

    const member = await prisma.member.create({
      data: {
        firstName,
        lastName,
        email,
        dni,
        birthDate,
        phone,
        memberId,
        condition: input.condition,
        status: input.status,
      },
    });

    const dto = toMemberDto(member);
    log.info(
      {
        memberId: dto.id,
        externalMemberId: memberId,
        email,
        dni,
        source,
        status: dto.status,
        condition: dto.condition,
      },
      "Member created",
    );
    if (notify) {
      void notifyAdminNewMember(dto, source);
    }
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

    let email: string | null | undefined;
    if (input.email !== undefined) {
      email = this.resolveOptionalEmail(input.email);
      if (email) {
        const taken = await prisma.member.findFirst({
          where: { email, NOT: { id } },
        });
        if (taken) {
          log.warn({ memberId: id, email }, "Update rejected: email taken");
          throw new AppError("Email already in use", 409, "EMAIL_TAKEN");
        }
      }
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

    let externalMemberId: string | null | undefined;
    if (input.memberId !== undefined) {
      externalMemberId = this.resolveMemberId(input.memberId);
      await this.assertMemberIdAvailable(externalMemberId, id);
    }

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
        email,
        dni,
        birthDate,
        phone: input.phone !== undefined ? normalizePhone(input.phone) : undefined,
        memberId: externalMemberId,
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

  private resolveOptionalEmail(value: string | null | undefined): string | null {
    const normalized = normalizeOptionalMemberEmail(value);
    if (!isValidOptionalMemberEmail(normalized)) {
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

  private resolveMemberId(value: string | null | undefined): string | null {
    const normalized = normalizeOptionalMemberId(value);
    if (!isValidOptionalMemberId(normalized)) {
      throw new AppError(
        `External member id must be at most ${MEMBER_EXTERNAL_ID_MAX_LENGTH} characters`,
        400,
        "INVALID_MEMBER_ID",
      );
    }
    return normalized;
  }

  private async assertMemberIdAvailable(
    memberId: string | null,
    excludeMemberId?: string,
  ): Promise<void> {
    if (!memberId) {
      return;
    }

    const existing = await prisma.member.findUnique({ where: { memberId } });
    if (existing && existing.id !== excludeMemberId) {
      log.warn({ externalMemberId: memberId }, "External member id already in use");
      throw new AppError("External member id already in use", 409, "MEMBER_ID_TAKEN");
    }
  }

  private buildListWhere(query: MemberListQuery): Prisma.MemberWhereInput {
    const where: Prisma.MemberWhereInput = {};

    if (query.search?.trim()) {
      const search = query.search.trim();
      const dniSearch = normalizeMemberDni(search);
      where.OR = [
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
        { memberId: { contains: search, mode: "insensitive" } },
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

    return where;
  }

  private rowIdentity(row: ParsedMemberImportRow): MemberImportRowIdentity {
    return {
      row: row.row,
      firstName: row.firstName || undefined,
      lastName: row.lastName || undefined,
      email: row.email || undefined,
      dni: row.dni || undefined,
      memberId: row.memberId,
    };
  }

  private async importOneRow(row: ParsedMemberImportRow): Promise<"created" | "restored"> {
    const firstName = this.assertValidNamePart(row.firstName, "first name");
    const lastName = this.assertValidNamePart(row.lastName, "last name");
    const email = this.resolveOptionalEmail(row.email);
    const dni = this.assertValidDni(row.dni);
    const birthDate = this.assertValidBirthDate(row.birthDate);
    const memberId = this.resolveMemberId(row.memberId);
    const phone = normalizePhone(row.phone);
    this.assertValidStatus(row.status);

    const orClauses: Prisma.MemberWhereInput[] = [{ dni }];
    if (email) {
      orClauses.push({ email });
    }
    if (memberId) {
      orClauses.push({ memberId });
    }

    const activeMatches = await prisma.member.findMany({
      where: { deletedAt: null, OR: orClauses },
    });

    if (activeMatches.length > 0) {
      const reasons: string[] = [];
      if (email && activeMatches.some((m) => m.email === email)) {
        reasons.push("Email ya existe");
      }
      if (activeMatches.some((m) => m.dni === dni)) {
        reasons.push("DNI ya existe");
      }
      if (memberId && activeMatches.some((m) => m.memberId === memberId)) {
        reasons.push("Nro. Socio ya existe");
      }
      throw new AppError(reasons.join("; ") || "Socio ya existe", 409, "MEMBER_EXISTS");
    }

    const deletedMatches = await prisma.member.findMany({
      where: { deletedAt: { not: null }, OR: orClauses },
    });
    const deletedIds = [...new Set(deletedMatches.map((m) => m.id))];

    if (deletedIds.length > 1) {
      throw new AppError(
        "Coincide con más de un socio eliminado (email/DNI/Nro. Socio apuntan a registros distintos)",
        409,
        "IMPORT_DELETED_CONFLICT",
      );
    }

    if (deletedIds.length === 1) {
      await prisma.member.update({
        where: { id: deletedIds[0] },
        data: {
          firstName,
          lastName,
          email,
          dni,
          birthDate,
          phone,
          memberId,
          condition: row.condition,
          status: row.status,
          deletedAt: null,
          deletedReason: null,
          deletedReasonDetail: null,
        },
      });
      return "restored";
    }

    await prisma.member.create({
      data: {
        firstName,
        lastName,
        email,
        dni,
        birthDate,
        phone,
        memberId,
        condition: row.condition,
        status: row.status,
      },
    });
    return "created";
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
