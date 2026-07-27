import type { UserRole } from "@socios/shared";
import { canManageMembers, canManageUsers } from "@socios/shared";
import type { FastifyReply, FastifyRequest } from "fastify";
import fp from "fastify-plugin";
import { AppError } from "../lib/errors.js";
import { getLogger } from "../lib/logger.js";

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  name: string;
}

declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: JwtPayload;
    user: JwtPayload;
  }
}

const log = getLogger("auth");

async function authPlugin(fastify: import("fastify").FastifyInstance): Promise<void> {
  fastify.decorate("authenticate", async (request: FastifyRequest, _reply: FastifyReply) => {
    try {
      await request.jwtVerify();
      log.debug(
        { userId: request.user.sub, role: request.user.role, path: request.url },
        "Request authenticated",
      );
    } catch {
      log.warn({ path: request.url, method: request.method }, "Authentication failed");
      throw new AppError("Unauthorized", 401, "UNAUTHORIZED");
    }
  });

  fastify.decorate("requireMemberWrite", async (request: FastifyRequest, _reply: FastifyReply) => {
    await fastify.authenticate(request, _reply);
    if (!canManageMembers(request.user.role)) {
      log.warn(
        { userId: request.user.sub, role: request.user.role, path: request.url },
        "Member write access denied",
      );
      throw new AppError("Forbidden: member write access required", 403, "FORBIDDEN");
    }
  });

  fastify.decorate("requireSuperAdmin", async (request: FastifyRequest, _reply: FastifyReply) => {
    await fastify.authenticate(request, _reply);
    if (!canManageUsers(request.user.role)) {
      log.warn(
        { userId: request.user.sub, role: request.user.role, path: request.url },
        "Super admin access denied",
      );
      throw new AppError("Forbidden: super admin required", 403, "FORBIDDEN");
    }
  });

  /** @deprecated Use requireMemberWrite */
  fastify.decorate("requireAdmin", async (request: FastifyRequest, reply: FastifyReply) => {
    await fastify.requireMemberWrite(request, reply);
  });
}

export default fp(authPlugin);

declare module "fastify" {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    requireMemberWrite: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    requireSuperAdmin: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    requireAdmin: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}
