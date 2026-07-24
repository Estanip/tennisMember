import cors from "@fastify/cors";
import jwt from "@fastify/jwt";
import rateLimit from "@fastify/rate-limit";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import Fastify from "fastify";
import { authRoutes } from "./modules/auth/auth.routes.js";
import { memberRoutes } from "./modules/members/member.routes.js";
import { googleFormWebhookRoutes } from "./modules/webhooks/google-form.routes.js";
import authPlugin from "./plugins/auth.js";
import errorHandlerPlugin, { notFoundHandler } from "./plugins/error-handler.js";

export async function buildApp() {
  const app = Fastify({
    logger: true,
  });

  await app.register(cors, {
    origin: process.env.CORS_ORIGIN ?? "http://localhost:3000",
    credentials: true,
    methods: ["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Webhook-Secret"],
  });

  await app.register(rateLimit, {
    max: 100,
    timeWindow: "15 minutes",
  });

  await app.register(jwt, {
    secret: process.env.JWT_SECRET ?? "local-dev-jwt-secret-change-me",
  });

  await app.register(swagger, {
    openapi: {
      info: {
        title: "Socios Backoffice API",
        description: "API for tennis club member management",
        version: "0.1.0",
      },
      components: {
        securitySchemes: {
          bearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT",
          },
        },
      },
    },
  });

  await app.register(swaggerUi, {
    routePrefix: "/docs",
  });

  await app.register(errorHandlerPlugin);
  await app.register(authPlugin);

  app.setNotFoundHandler(notFoundHandler);

  app.get(
    "/health",
    {
      schema: {
        tags: ["Health"],
        summary: "Health check",
        response: {
          200: {
            type: "object",
            required: ["success", "data"],
            additionalProperties: false,
            properties: {
              success: { type: "boolean" },
              data: {
                type: "object",
                required: ["status"],
                additionalProperties: false,
                properties: {
                  status: { type: "string" },
                },
              },
            },
          },
        },
      },
    },
    async () => ({ success: true, data: { status: "ok" } }),
  );

  await app.register(authRoutes, { prefix: "/api" });
  await app.register(memberRoutes, { prefix: "/api" });
  await app.register(googleFormWebhookRoutes, { prefix: "/api" });

  return app;
}
