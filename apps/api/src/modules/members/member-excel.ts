import type { Member, MemberCondition, MemberStatus } from "@socios/shared";
import {
  MEMBER_CONDITION_LABELS,
  MEMBER_EXCEL_HEADER_ORDER,
  MEMBER_EXCEL_HEADERS,
  MEMBER_STATUS_LABELS,
  parseMemberExcelCondition,
  parseMemberExcelStatus,
} from "@socios/shared";
import ExcelJS from "exceljs";
import { AppError } from "../../lib/errors.js";

export interface ParsedMemberImportRow {
  row: number;
  memberId: string | null;
  firstName: string;
  lastName: string;
  email: string | null;
  dni: string;
  birthDate: string;
  phone: string | null;
  condition: MemberCondition;
  status: MemberStatus;
}

function cellToString(value: ExcelJS.CellValue): string {
  if (value === null || value === undefined) {
    return "";
  }
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value).trim();
  }
  if (value instanceof Date) {
    const y = value.getUTCFullYear();
    const m = String(value.getUTCMonth() + 1).padStart(2, "0");
    const d = String(value.getUTCDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  if (typeof value === "object" && "text" in value && typeof value.text === "string") {
    return value.text.trim();
  }
  if (typeof value === "object" && "result" in value) {
    return cellToString(value.result as ExcelJS.CellValue);
  }
  return String(value).trim();
}

function assertTemplateHeaders(sheet: ExcelJS.Worksheet): void {
  const headerRow = sheet.getRow(1);
  for (let i = 0; i < MEMBER_EXCEL_HEADER_ORDER.length; i += 1) {
    const expected = MEMBER_EXCEL_HEADER_ORDER[i];
    const actual = cellToString(headerRow.getCell(i + 1).value);
    if (actual !== expected) {
      throw new AppError(
        `Plantilla inválida: se esperaba la columna "${expected}" en la posición ${i + 1}, se recibió "${actual || "(vacío)"}"`,
        400,
        "INVALID_IMPORT_TEMPLATE",
      );
    }
  }
}

export async function buildMembersWorkbook(
  members: Member[],
  options: { includeExampleRow?: boolean } = {},
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Socios");

  sheet.addRow([...MEMBER_EXCEL_HEADER_ORDER]);
  sheet.getRow(1).font = { bold: true };

  if (options.includeExampleRow && members.length === 0) {
    sheet.addRow([
      "",
      "Juan",
      "Perez",
      "juan.perez@example.com",
      "30123456",
      "1990-05-20",
      "2914123456",
      MEMBER_CONDITION_LABELS.SOCIO_REGULAR,
      MEMBER_STATUS_LABELS[1],
    ]);
  }

  for (const member of members) {
    sheet.addRow([
      member.memberId ?? "",
      member.firstName,
      member.lastName,
      member.email ?? "",
      member.dni,
      member.birthDate,
      member.phone ?? "",
      MEMBER_CONDITION_LABELS[member.condition],
      MEMBER_STATUS_LABELS[member.status] ?? String(member.status),
    ]);
  }

  sheet.columns = MEMBER_EXCEL_HEADER_ORDER.map((header) => ({
    header,
    width: Math.max(header.length + 2, 18),
  }));

  const arrayBuffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer);
}

export async function parseMembersImportWorkbook(
  buffer: Buffer,
): Promise<
  Array<ParsedMemberImportRow | { row: number; error: string; raw: Record<string, string> }>
> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as unknown as ExcelJS.Buffer);
  const sheet = workbook.worksheets[0];
  if (!sheet) {
    throw new AppError("El archivo Excel no tiene hojas", 400, "INVALID_IMPORT_FILE");
  }

  assertTemplateHeaders(sheet);

  const rows: Array<
    ParsedMemberImportRow | { row: number; error: string; raw: Record<string, string> }
  > = [];

  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) {
      return;
    }

    const raw = {
      [MEMBER_EXCEL_HEADERS.memberId]: cellToString(row.getCell(1).value),
      [MEMBER_EXCEL_HEADERS.firstName]: cellToString(row.getCell(2).value),
      [MEMBER_EXCEL_HEADERS.lastName]: cellToString(row.getCell(3).value),
      [MEMBER_EXCEL_HEADERS.email]: cellToString(row.getCell(4).value),
      [MEMBER_EXCEL_HEADERS.dni]: cellToString(row.getCell(5).value),
      [MEMBER_EXCEL_HEADERS.birthDate]: cellToString(row.getCell(6).value),
      [MEMBER_EXCEL_HEADERS.phone]: cellToString(row.getCell(7).value),
      [MEMBER_EXCEL_HEADERS.condition]: cellToString(row.getCell(8).value),
      [MEMBER_EXCEL_HEADERS.status]: cellToString(row.getCell(9).value),
    };

    const isEmpty = Object.values(raw).every((v) => !v);
    if (isEmpty) {
      return;
    }

    const condition = parseMemberExcelCondition(raw[MEMBER_EXCEL_HEADERS.condition]);
    if (!condition) {
      rows.push({
        row: rowNumber,
        error: "Condición inválida (usar Socio Regular o Abonado Tenis)",
        raw,
      });
      return;
    }

    const status = parseMemberExcelStatus(raw[MEMBER_EXCEL_HEADERS.status]);
    if (status === null) {
      rows.push({
        row: rowNumber,
        error: "Estado inválido (usar No Habilitado, Habilitado o Pendiente)",
        raw,
      });
      return;
    }

    rows.push({
      row: rowNumber,
      memberId: raw[MEMBER_EXCEL_HEADERS.memberId] || null,
      firstName: raw[MEMBER_EXCEL_HEADERS.firstName],
      lastName: raw[MEMBER_EXCEL_HEADERS.lastName],
      email: raw[MEMBER_EXCEL_HEADERS.email] || null,
      dni: raw[MEMBER_EXCEL_HEADERS.dni],
      birthDate: raw[MEMBER_EXCEL_HEADERS.birthDate],
      phone: raw[MEMBER_EXCEL_HEADERS.phone] || null,
      condition,
      status,
    });
  });

  return rows;
}
