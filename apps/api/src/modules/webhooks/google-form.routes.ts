import type { GoogleFormMemberPayload } from "@socios/shared";
import { MEMBER_CONDITIONS, MEMBER_STATUS } from "@socios/shared";
import type { FastifyInstance } from "fastify";
import { GoogleFormWebhookService } from "./google-form.service.js";

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

const webhookBodySchema = {
  type: "object",
  required: ["email", "fullName", "age", "phone"],
  additionalProperties: false,
  properties: {
    email: { type: "string", format: "email" },
    fullName: { type: "string", minLength: 1 },
    age: { type: "integer", minimum: 0, maximum: 120 },
    phone: { type: "string", minLength: 1 },
  },
} as const;

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
    status: {
      type: "integer",
      enum: [MEMBER_STATUS.DISABLED, MEMBER_STATUS.ENABLED, MEMBER_STATUS.PENDING],
    },
    createdAt: { type: "string" },
    updatedAt: { type: "string" },
  },
} as const;

export async function googleFormWebhookRoutes(app: FastifyInstance): Promise<void> {
  const webhookService = new GoogleFormWebhookService();

  app.post(
    "/webhooks/google-form",
    {
      schema: {
        tags: ["Webhooks"],
        summary: "Create pending Abonado Tenis member from Google Form",
        headers: {
          type: "object",
          required: ["x-webhook-secret"],
          properties: {
            "x-webhook-secret": { type: "string" },
          },
        },
        body: webhookBodySchema,
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
          409: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const secretHeader = request.headers["x-webhook-secret"];
      const secret = Array.isArray(secretHeader) ? secretHeader[0] : secretHeader;
      webhookService.assertSecret(secret);

      const body = request.body as GoogleFormMemberPayload;
      const data = await webhookService.createFromForm(body);

      return reply.status(201).send({
        success: true,
        data,
        message: "Member created as pending Abonado Tenis",
      });
    },
  );
}
