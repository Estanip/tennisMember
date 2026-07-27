import { USER_ROLE_VALUES } from "@socios/shared";
import type { FastifyInstance } from "fastify";
import { AuthService } from "./auth.service.js";

const loginBodySchema = {
  type: "object",
  required: ["identifier", "password"],
  additionalProperties: false,
  properties: {
    identifier: { type: "string", minLength: 1 },
    password: { type: "string", minLength: 1 },
  },
} as const;

const loginResponseSchema = {
  type: "object",
  required: ["success", "data"],
  additionalProperties: false,
  properties: {
    success: { type: "boolean" },
    message: { type: "string" },
    data: {
      type: "object",
      required: ["token", "user"],
      additionalProperties: false,
      properties: {
        token: { type: "string" },
        user: {
          type: "object",
          required: ["id", "email", "name", "role"],
          additionalProperties: false,
          properties: {
            id: { type: "string" },
            email: { type: "string" },
            name: { type: "string" },
            role: { type: "string", enum: [...USER_ROLE_VALUES] },
          },
        },
      },
    },
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

export async function authRoutes(app: FastifyInstance): Promise<void> {
  const authService = new AuthService(app);

  app.post(
    "/auth/login",
    {
      schema: {
        tags: ["Auth"],
        summary: "Login with email or username and password",
        body: loginBodySchema,
        response: {
          200: loginResponseSchema,
          401: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const body = request.body as { identifier: string; password: string };
      const data = await authService.login(body);
      return reply.send({ success: true, data });
    },
  );

  app.get(
    "/auth/me",
    {
      preHandler: [app.authenticate],
      schema: {
        tags: ["Auth"],
        summary: "Get current authenticated user",
        security: [{ bearerAuth: [] }],
        response: {
          200: {
            type: "object",
            required: ["success", "data"],
            additionalProperties: false,
            properties: {
              success: { type: "boolean" },
              data: {
                type: "object",
                required: ["id", "email", "name", "role"],
                additionalProperties: false,
                properties: {
                  id: { type: "string" },
                  email: { type: "string" },
                  name: { type: "string" },
                  role: { type: "string", enum: [...USER_ROLE_VALUES] },
                },
              },
            },
          },
          401: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      return reply.send({
        success: true,
        data: {
          id: request.user.sub,
          email: request.user.email,
          name: request.user.name,
          role: request.user.role,
        },
      });
    },
  );
}
