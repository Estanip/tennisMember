import { MEMBER_CONDITIONS, MEMBER_STATUS_VALUES } from "@socios/shared";
import type { FastifyInstance } from "fastify";
import { MemberService } from "./member.service.js";

const memberSchema = {
  type: "object",
  required: [
    "id",
    "fullName",
    "email",
    "age",
    "phone",
    "condition",
    "status",
    "createdAt",
    "updatedAt",
  ],
  additionalProperties: false,
  properties: {
    id: { type: "string" },
    fullName: { type: "string" },
    email: { type: "string" },
    age: { type: "integer" },
    phone: { type: ["string", "null"] },
    condition: {
      type: "string",
      enum: [MEMBER_CONDITIONS.SOCIO_REGULAR, MEMBER_CONDITIONS.ABONADO_TENIS],
    },
    status: { type: "integer", enum: [...MEMBER_STATUS_VALUES] },
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
  required: ["fullName", "email", "age", "condition", "status"],
  additionalProperties: false,
  properties: {
    fullName: { type: "string", minLength: 1 },
    email: { type: "string", format: "email" },
    age: { type: "integer", minimum: 0, maximum: 120 },
    phone: { type: ["string", "null"] },
    condition: {
      type: "string",
      enum: [MEMBER_CONDITIONS.SOCIO_REGULAR, MEMBER_CONDITIONS.ABONADO_TENIS],
    },
    status: { type: "integer", enum: [...MEMBER_STATUS_VALUES] },
  },
} as const;

const updateBodySchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    fullName: { type: "string", minLength: 1 },
    age: { type: "integer", minimum: 0, maximum: 120 },
    phone: { type: ["string", "null"] },
    condition: {
      type: "string",
      enum: [MEMBER_CONDITIONS.SOCIO_REGULAR, MEMBER_CONDITIONS.ABONADO_TENIS],
    },
    status: { type: "integer", enum: [...MEMBER_STATUS_VALUES] },
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
      preHandler: [app.requireAdmin],
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
      preHandler: [app.requireAdmin],
      schema: {
        tags: ["Members"],
        summary: "Update member (ADMIN) — email is immutable",
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
      const data = await memberService.update(id, request.body as never);
      return reply.send({ success: true, data, message: "Member updated" });
    },
  );

  app.delete(
    "/members/:id",
    {
      preHandler: [app.requireAdmin],
      schema: {
        tags: ["Members"],
        summary: "Soft delete member (ADMIN)",
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
            required: ["success", "message"],
            additionalProperties: false,
            properties: {
              success: { type: "boolean" },
              message: { type: "string" },
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
      await memberService.softDelete(id);
      return reply.send({ success: true, message: "Member deleted" });
    },
  );
}
