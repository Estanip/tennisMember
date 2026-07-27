import type { AuthUser, LoginRequest, LoginResponse, UserRole } from "@socios/shared";
import { normalizeMemberEmail, normalizeUsername } from "@socios/shared";
import bcrypt from "bcryptjs";
import type { FastifyInstance } from "fastify";
import { AppError } from "../../lib/errors.js";
import { getLogger } from "../../lib/logger.js";
import { prisma } from "../../lib/prisma.js";

const log = getLogger("auth");

export class AuthService {
  constructor(private readonly app: FastifyInstance) {}

  async login(input: LoginRequest): Promise<LoginResponse> {
    const identifier = input.identifier.trim();
    const user = await this.findUserByIdentifier(identifier);

    if (!user) {
      log.warn({ identifier }, "Login failed: user not found");
      throw new AppError("Invalid email, username or password", 401, "INVALID_CREDENTIALS");
    }

    const isValid = await bcrypt.compare(input.password, user.passwordHash);
    if (!isValid) {
      log.warn({ identifier, userId: user.id }, "Login failed: invalid password");
      throw new AppError("Invalid email, username or password", 401, "INVALID_CREDENTIALS");
    }

    const authUser: AuthUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as UserRole,
    };

    const token = this.app.jwt.sign({
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role as UserRole,
    });

    log.info({ userId: user.id, email: user.email, role: user.role }, "Login successful");
    return { token, user: authUser };
  }

  private async findUserByIdentifier(identifier: string) {
    if (identifier.includes("@")) {
      const email = normalizeMemberEmail(identifier);
      return prisma.user.findUnique({ where: { email } });
    }

    const username = normalizeUsername(identifier);
    if (!username) {
      return null;
    }

    return prisma.user.findUnique({ where: { username } });
  }
}
