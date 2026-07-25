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
  required: ["email", "firstName", "lastName", "dni", "birthDate", "phone"],
  additionalProperties: false,
  properties: {
    email: { type: "string", format: "email", maxLength: 254 },
    firstName: { type: "string", minLength: 2, maxLength: 60 },
    lastName: { type: "string", minLength: 2, maxLength: 60 },
    dni: { type: "string", pattern: "^\\d{7,8}$", minLength: 7, maxLength: 8 },
    birthDate: { type: "string", minLength: 8, maxLength: 10 },
    phone: { type: "string", pattern: "^\\d{10}$" },
  },
} as const;

const memberSchema = {
  type: "object",
  required: [
    "id",
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
    "createdAt",
    "updatedAt",
  ],
  additionalProperties: false,
  properties: {
    id: { type: "string" },
    firstName: { type: "string" },
    lastName: { type: "string" },
    fullName: { type: "string" },
    email: { type: "string" },
    dni: { type: "string" },
    birthDate: { type: "string" },
    age: { type: "integer" },
    ageCategory: { type: "string", enum: ["ADULTO", "MENOR"] },
    phone: { type: ["string", "null"] },
    condition: {
      type: "string",
      enum: [MEMBER_CONDITIONS.SOCIO_REGULAR, MEMBER_CONDITIONS.ABONADO_TENIS],
    },
    status: {
      type: "integer",
      enum: [
        MEMBER_STATUS.DISABLED,
        MEMBER_STATUS.ENABLED,
        MEMBER_STATUS.PENDING,
        MEMBER_STATUS.DELETED,
      ],
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
