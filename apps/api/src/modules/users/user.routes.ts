import { USER_ROLE_VALUES } from "@socios/shared";
import type { FastifyInstance } from "fastify";
import { UserService } from "./user.service.js";

const userSchema = {
  type: "object",
  required: ["id", "email", "username", "name", "role", "createdAt", "updatedAt"],
  additionalProperties: false,
  properties: {
    id: { type: "string" },
    email: { type: "string" },
    username: { type: ["string", "null"] },
    name: { type: "string" },
    role: { type: "string", enum: [...USER_ROLE_VALUES] },
    createdAt: { type: "string" },
    updatedAt: { type: "string" },
  },
} as const;

const paginatedUsersSchema = {
  type: "object",
  required: ["items", "total", "page", "pageSize", "totalPages"],
  additionalProperties: false,
  properties: {
    items: { type: "array", items: userSchema },
    total: { type: "integer" },
    page: { type: "integer" },
    pageSize: { type: "integer" },
    totalPages: { type: "integer" },
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
  required: ["email", "name", "password", "role"],
  additionalProperties: false,
  properties: {
    email: { type: "string", format: "email", maxLength: 254 },
    username: {
      anyOf: [
        { type: "null" },
        { type: "string", minLength: 3, maxLength: 30, pattern: "^[a-z][a-z0-9._-]{2,29}$" },
        { type: "string", maxLength: 0 },
      ],
    },
    name: { type: "string", minLength: 2, maxLength: 80 },
    password: { type: "string", minLength: 8 },
    role: { type: "string", enum: [...USER_ROLE_VALUES] },
  },
} as const;

const updateBodySchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    name: { type: "string", minLength: 2, maxLength: 80 },
    username: {
      anyOf: [
        { type: "null" },
        { type: "string", minLength: 3, maxLength: 30, pattern: "^[a-z][a-z0-9._-]{2,29}$" },
        { type: "string", maxLength: 0 },
      ],
    },
    password: { type: "string", minLength: 8 },
    role: { type: "string", enum: [...USER_ROLE_VALUES] },
  },
} as const;

export async function userRoutes(app: FastifyInstance): Promise<void> {
  const users = new UserService();

  app.get(
    "/users",
    {
      preHandler: [app.requireSuperAdmin],
      schema: {
        tags: ["Users"],
        summary: "List backoffice users (SUPER_ADMIN)",
        security: [{ bearerAuth: [] }],
        querystring: {
          type: "object",
          additionalProperties: false,
          properties: {
            page: { type: "integer", minimum: 1 },
            pageSize: { type: "integer", minimum: 1, maximum: 100 },
            search: { type: "string" },
          },
        },
        response: {
          200: {
            type: "object",
            required: ["success", "data"],
            additionalProperties: false,
            properties: {
              success: { type: "boolean" },
              data: paginatedUsersSchema,
            },
          },
          403: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const query = request.query as { page?: number; pageSize?: number; search?: string };
      const data = await users.list(query);
      return reply.send({ success: true, data });
    },
  );

  app.get(
    "/users/:id",
    {
      preHandler: [app.requireSuperAdmin],
      schema: {
        tags: ["Users"],
        summary: "Get backoffice user by id (SUPER_ADMIN)",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["id"],
          properties: { id: { type: "string" } },
        },
        response: {
          200: {
            type: "object",
            required: ["success", "data"],
            additionalProperties: false,
            properties: {
              success: { type: "boolean" },
              data: userSchema,
            },
          },
          404: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const data = await users.getById(id);
      return reply.send({ success: true, data });
    },
  );

  app.post(
    "/users",
    {
      preHandler: [app.requireSuperAdmin],
      schema: {
        tags: ["Users"],
        summary: "Create backoffice user (SUPER_ADMIN)",
        security: [{ bearerAuth: [] }],
        body: createBodySchema,
        response: {
          201: {
            type: "object",
            required: ["success", "data"],
            additionalProperties: false,
            properties: {
              success: { type: "boolean" },
              data: userSchema,
            },
          },
          409: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const body = request.body as {
        email: string;
        username?: string | null;
        name: string;
        password: string;
        role: (typeof USER_ROLE_VALUES)[number];
      };
      const data = await users.create(body);
      return reply.status(201).send({ success: true, data });
    },
  );

  app.patch(
    "/users/:id",
    {
      preHandler: [app.requireSuperAdmin],
      schema: {
        tags: ["Users"],
        summary: "Update backoffice user (SUPER_ADMIN)",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["id"],
          properties: { id: { type: "string" } },
        },
        body: updateBodySchema,
        response: {
          200: {
            type: "object",
            required: ["success", "data"],
            additionalProperties: false,
            properties: {
              success: { type: "boolean" },
              data: userSchema,
            },
          },
          404: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const body = request.body as {
        name?: string;
        username?: string | null;
        password?: string;
        role?: (typeof USER_ROLE_VALUES)[number];
      };
      const data = await users.update(id, body, request.user.sub);
      return reply.send({ success: true, data });
    },
  );
}
