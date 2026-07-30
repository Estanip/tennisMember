import {
  MEMBER_AGE_CATEGORIES,
  MEMBER_CONDITIONS,
  MEMBER_DELETE_REASON_VALUES,
  MEMBER_EDITABLE_STATUS_VALUES,
  MEMBER_EMAIL_PATTERN,
  MEMBER_EXTERNAL_ID_MAX_LENGTH,
  MEMBER_STATUS_VALUES,
} from "@socios/shared";
import type { FastifyInstance } from "fastify";
import { AppError } from "../../lib/errors.js";
import { MemberService } from "./member.service.js";

/** Aligned with `@socios/shared` — avoid AJV `format: email` (stricter / mismatched). */
const optionalMemberEmailSchema = {
  anyOf: [
    { type: "null" },
    { type: "string", maxLength: 0 },
    { type: "string", maxLength: 254, pattern: MEMBER_EMAIL_PATTERN.source },
  ],
} as const;

const memberSchema = {
  type: "object",
  required: [
    "id",
    "memberId",
    "firstName",
    "lastName",
    "fullName",
    "email",
    "dni",
    "birthDate",
    "age",
    "ageCategory",
    "phone",
    "condition",
    "status",
    "deletedReason",
    "deletedReasonDetail",
    "createdAt",
    "updatedAt",
  ],
  additionalProperties: false,
  properties: {
    id: { type: "string" },
    memberId: { type: ["string", "null"] },
    firstName: { type: "string" },
    lastName: { type: "string" },
    fullName: { type: "string" },
    email: { type: ["string", "null"] },
    dni: { type: "string" },
    birthDate: { type: "string" },
    age: { type: "integer" },
    ageCategory: {
      type: "string",
      enum: [MEMBER_AGE_CATEGORIES.ADULTO, MEMBER_AGE_CATEGORIES.MENOR],
    },
    phone: { type: ["string", "null"] },
    condition: {
      type: "string",
      enum: [MEMBER_CONDITIONS.SOCIO_REGULAR, MEMBER_CONDITIONS.ABONADO_TENIS],
    },
    status: { type: "integer", enum: [...MEMBER_STATUS_VALUES] },
    deletedReason: {
      type: ["string", "null"],
      enum: [...MEMBER_DELETE_REASON_VALUES, null],
    },
    deletedReasonDetail: { type: ["string", "null"] },
    createdAt: { type: "string" },
    updatedAt: { type: "string" },
  },
} as const;

const errorResponseSchema = {
  type: "object",
  required: ["success"],
  additionalProperties: false,
  properties: {
    success: { type: "boolean" },
    error: { type: "string" },
    message: { type: "string" },
  },
} as const;

const createBodySchema = {
  type: "object",
  required: ["firstName", "lastName", "dni", "birthDate", "condition", "status"],
  additionalProperties: false,
  properties: {
    firstName: { type: "string", minLength: 2, maxLength: 60 },
    lastName: { type: "string", minLength: 2, maxLength: 60 },
    email: optionalMemberEmailSchema,
    dni: { type: "string", pattern: "^\\d{7,8}$", minLength: 7, maxLength: 8 },
    birthDate: { type: "string", minLength: 8, maxLength: 10 },
    phone: {
      anyOf: [
        { type: "null" },
        { type: "string", pattern: "^\\d{10}$" },
        { type: "string", maxLength: 0 },
      ],
    },
    memberId: {
      anyOf: [
        { type: "null" },
        { type: "string", minLength: 1, maxLength: MEMBER_EXTERNAL_ID_MAX_LENGTH },
        { type: "string", maxLength: 0 },
      ],
    },
    condition: {
      type: "string",
      enum: [MEMBER_CONDITIONS.SOCIO_REGULAR, MEMBER_CONDITIONS.ABONADO_TENIS],
    },
    status: { type: "integer", enum: [...MEMBER_EDITABLE_STATUS_VALUES] },
  },
} as const;

const updateBodySchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    firstName: { type: "string", minLength: 2, maxLength: 60 },
    lastName: { type: "string", minLength: 2, maxLength: 60 },
    email: optionalMemberEmailSchema,
    dni: { type: "string", pattern: "^\\d{7,8}$", minLength: 7, maxLength: 8 },
    birthDate: { type: "string", minLength: 8, maxLength: 10 },
    phone: {
      anyOf: [
        { type: "null" },
        { type: "string", pattern: "^\\d{10}$" },
        { type: "string", maxLength: 0 },
      ],
    },
    memberId: {
      anyOf: [
        { type: "null" },
        { type: "string", minLength: 1, maxLength: MEMBER_EXTERNAL_ID_MAX_LENGTH },
        { type: "string", maxLength: 0 },
      ],
    },
    condition: {
      type: "string",
      enum: [MEMBER_CONDITIONS.SOCIO_REGULAR, MEMBER_CONDITIONS.ABONADO_TENIS],
    },
    status: { type: "integer", enum: [...MEMBER_EDITABLE_STATUS_VALUES] },
  },
} as const;

const deleteBodySchema = {
  type: "object",
  required: ["reason"],
  additionalProperties: false,
  properties: {
    reason: {
      type: "string",
      enum: [...MEMBER_DELETE_REASON_VALUES],
    },
    detail: {
      anyOf: [
        { type: "null" },
        { type: "string", maxLength: 500 },
        { type: "string", maxLength: 0 },
      ],
    },
  },
} as const;

export async function memberRoutes(app: FastifyInstance): Promise<void> {
  const memberService = new MemberService();

  app.get(
    "/members",
    {
      preHandler: [app.authenticate],
      schema: {
        tags: ["Members"],
        summary: "List members with search, filters and pagination",
        security: [{ bearerAuth: [] }],
        querystring: {
          type: "object",
          additionalProperties: false,
          properties: {
            page: { type: "integer", minimum: 1 },
            pageSize: { type: "integer", minimum: 1, maximum: 100 },
            search: { type: "string" },
            condition: {
              type: "string",
              enum: [MEMBER_CONDITIONS.SOCIO_REGULAR, MEMBER_CONDITIONS.ABONADO_TENIS],
            },
            status: { type: "integer", enum: [...MEMBER_STATUS_VALUES] },
          },
        },
        response: {
          200: {
            type: "object",
            required: ["success", "data"],
            additionalProperties: false,
            properties: {
              success: { type: "boolean" },
              data: {
                type: "object",
                required: ["items", "total", "page", "pageSize", "totalPages"],
                additionalProperties: false,
                properties: {
                  items: { type: "array", items: memberSchema },
                  total: { type: "integer" },
                  page: { type: "integer" },
                  pageSize: { type: "integer" },
                  totalPages: { type: "integer" },
                },
              },
            },
          },
          401: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const query = request.query as {
        page?: number;
        pageSize?: number;
        search?: string;
        condition?: string;
        status?: number;
      };
      const data = await memberService.list({
        page: query.page,
        pageSize: query.pageSize,
        search: query.search,
        condition: query.condition as never,
        status: query.status as never,
      });
      return reply.send({ success: true, data });
    },
  );

  app.get(
    "/members/export",
    {
      preHandler: [app.authenticate],
      schema: {
        tags: ["Members"],
        summary: "Export members to Excel (.xlsx) using current filters",
        security: [{ bearerAuth: [] }],
        querystring: {
          type: "object",
          additionalProperties: false,
          properties: {
            search: { type: "string" },
            condition: {
              type: "string",
              enum: [MEMBER_CONDITIONS.SOCIO_REGULAR, MEMBER_CONDITIONS.ABONADO_TENIS],
            },
            status: { type: "integer", enum: [...MEMBER_STATUS_VALUES] },
          },
        },
      },
    },
    async (request, reply) => {
      const query = request.query as {
        search?: string;
        condition?: string;
        status?: number;
      };
      const buffer = await memberService.exportWorkbook({
        search: query.search,
        condition: query.condition as never,
        status: query.status as never,
      });
      return reply
        .header("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
        .header("Content-Disposition", 'attachment; filename="socios.xlsx"')
        .send(buffer);
    },
  );

  app.get(
    "/members/import-template",
    {
      preHandler: [app.requireMemberWrite],
      schema: {
        tags: ["Members"],
        summary: "Download Excel import template",
        security: [{ bearerAuth: [] }],
      },
    },
    async (_request, reply) => {
      const buffer = await memberService.importTemplateWorkbook();
      return reply
        .header("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
        .header("Content-Disposition", 'attachment; filename="plantilla-socios.xlsx"')
        .send(buffer);
    },
  );

  app.post(
    "/members/import",
    {
      preHandler: [app.requireMemberWrite],
      schema: {
        tags: ["Members"],
        summary: "Import members from Excel (.xlsx)",
        security: [{ bearerAuth: [] }],
        consumes: ["multipart/form-data"],
        response: {
          200: {
            type: "object",
            required: ["success", "data"],
            additionalProperties: false,
            properties: {
              success: { type: "boolean" },
              data: {
                type: "object",
                required: ["created", "restored", "skipped", "restoredRows"],
                additionalProperties: false,
                properties: {
                  created: { type: "integer" },
                  restored: { type: "integer" },
                  skipped: {
                    type: "array",
                    items: {
                      type: "object",
                      required: ["row", "reason"],
                      additionalProperties: false,
                      properties: {
                        row: { type: "integer" },
                        reason: { type: "string" },
                        firstName: { type: "string" },
                        lastName: { type: "string" },
                        email: { type: "string" },
                        dni: { type: "string" },
                        memberId: { type: ["string", "null"] },
                      },
                    },
                  },
                  restoredRows: {
                    type: "array",
                    items: {
                      type: "object",
                      required: ["row"],
                      additionalProperties: false,
                      properties: {
                        row: { type: "integer" },
                        firstName: { type: "string" },
                        lastName: { type: "string" },
                        email: { type: "string" },
                        dni: { type: "string" },
                        memberId: { type: ["string", "null"] },
                      },
                    },
                  },
                },
              },
            },
          },
          400: errorResponseSchema,
          401: errorResponseSchema,
          403: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const file = await request.file();
      if (!file) {
        throw new AppError("Se requiere un archivo Excel (.xlsx)", 400, "FILE_REQUIRED");
      }
      const filename = file.filename.toLowerCase();
      if (!filename.endsWith(".xlsx")) {
        throw new AppError("El archivo debe ser .xlsx", 400, "INVALID_FILE_TYPE");
      }
      const buffer = await file.toBuffer();
      const data = await memberService.importFromExcel(buffer);
      return reply.send({ success: true, data });
    },
  );

  app.get(
    "/members/:id",
    {
      preHandler: [app.authenticate],
      schema: {
        tags: ["Members"],
        summary: "Get member by id",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["id"],
          additionalProperties: false,
          properties: {
            id: { type: "string" },
          },
        },
        response: {
          200: {
            type: "object",
            required: ["success", "data"],
            additionalProperties: false,
            properties: {
              success: { type: "boolean" },
              data: memberSchema,
            },
          },
          401: errorResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const data = await memberService.getById(id);
      return reply.send({ success: true, data });
    },
  );

  app.post(
    "/members",
    {
      preHandler: [app.requireMemberWrite],
      schema: {
        tags: ["Members"],
        summary: "Create member (ADMIN)",
        security: [{ bearerAuth: [] }],
        body: createBodySchema,
        response: {
          201: {
            type: "object",
            required: ["success", "data"],
            additionalProperties: false,
            properties: {
              success: { type: "boolean" },
              message: { type: "string" },
              data: memberSchema,
            },
          },
          400: errorResponseSchema,
          401: errorResponseSchema,
          403: errorResponseSchema,
          409: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const data = await memberService.create(request.body as never);
      return reply.status(201).send({ success: true, data, message: "Member created" });
    },
  );

  app.patch(
    "/members/:id",
    {
      preHandler: [app.requireMemberWrite],
      schema: {
        tags: ["Members"],
        summary: "Update member (ADMIN)",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["id"],
          additionalProperties: false,
          properties: {
            id: { type: "string" },
          },
        },
        body: updateBodySchema,
        response: {
          200: {
            type: "object",
            required: ["success", "data"],
            additionalProperties: false,
            properties: {
              success: { type: "boolean" },
              message: { type: "string" },
              data: memberSchema,
            },
          },
          400: errorResponseSchema,
          401: errorResponseSchema,
          403: errorResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const data = await memberService.update(id, request.body as never, {
        role: request.user.role,
        userId: request.user.sub,
      });
      return reply.send({ success: true, data, message: "Member updated" });
    },
  );

  app.delete(
    "/members/:id",
    {
      preHandler: [app.requireMemberWrite],
      schema: {
        tags: ["Members"],
        summary: "Soft delete member with reason (ADMIN)",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["id"],
          additionalProperties: false,
          properties: {
            id: { type: "string" },
          },
        },
        body: deleteBodySchema,
        response: {
          200: {
            type: "object",
            required: ["success", "message"],
            additionalProperties: false,
            properties: {
              success: { type: "boolean" },
              message: { type: "string" },
            },
          },
          400: errorResponseSchema,
          401: errorResponseSchema,
          403: errorResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      await memberService.softDelete(id, request.body as never);
      return reply.send({ success: true, message: "Member deleted" });
    },
  );

  app.post(
    "/members/:id/restore",
    {
      preHandler: [app.requireMemberWrite],
      schema: {
        tags: ["Members"],
        summary: "Restore soft-deleted member (ADMIN) — status Enabled, clear deletedAt",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["id"],
          additionalProperties: false,
          properties: {
            id: { type: "string" },
          },
        },
        response: {
          200: {
            type: "object",
            required: ["success", "data"],
            additionalProperties: false,
            properties: {
              success: { type: "boolean" },
              message: { type: "string" },
              data: memberSchema,
            },
          },
          401: errorResponseSchema,
          403: errorResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const data = await memberService.restore(id);
      return reply.send({ success: true, data, message: "Member restored" });
    },
  );
}
