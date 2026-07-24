import type { FastifyError, FastifyReply, FastifyRequest } from "fastify";
import fp from "fastify-plugin";
import { isAppError } from "../lib/errors.js";
import { prisma } from "../lib/prisma.js";

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return "Unexpected error";
}

function getErrorStack(error: unknown): string | null {
  if (error instanceof Error) {
    return error.stack ?? null;
  }
  return null;
}

function getStatusCode(error: unknown): number {
  if (isAppError(error)) {
    return error.statusCode;
  }
  if (typeof error === "object" && error !== null && "statusCode" in error) {
    const statusCode = (error as FastifyError).statusCode;
    if (typeof statusCode === "number") {
      return statusCode;
    }
  }
  return 500;
}

function getErrorCode(error: unknown): string {
  if (isAppError(error)) {
    return error.code;
  }
  if (typeof error === "object" && error !== null && "code" in error) {
    const code = (error as FastifyError).code;
    if (typeof code === "string") {
      return code;
    }
  }
  return "INTERNAL_SERVER_ERROR";
}

async function errorLoggerPlugin(fastify: import("fastify").FastifyInstance): Promise<void> {
  fastify.setErrorHandler(async (error, request, reply) => {
    const statusCode = getStatusCode(error);
    const message = getErrorMessage(error);

    if (statusCode >= 500) {
      await prisma.errorLog
        .create({
          data: {
            message,
            stack: getErrorStack(error),
            path: request.url,
            method: request.method,
            statusCode,
            userId:
              request.user && typeof request.user === "object" && "sub" in request.user
                ? String(request.user.sub)
                : null,
          },
        })
        .catch((logError: unknown) => {
          request.log.error({ err: logError }, "Failed to persist error log");
        });
    }

    return reply.status(statusCode).send({
      success: false,
      error: getErrorCode(error),
      message: statusCode >= 500 ? "Internal server error" : message,
    });
  });
}

export default fp(errorLoggerPlugin);

export async function notFoundHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  await reply.status(404).send({
    success: false,
    error: "NOT_FOUND",
    message: `Route ${request.method} ${request.url} not found`,
  });
}
