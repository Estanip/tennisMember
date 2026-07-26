import type { AuthUser, LoginRequest, LoginResponse, UserRole } from "@socios/shared";
import bcrypt from "bcryptjs";
import type { FastifyInstance } from "fastify";
import { AppError } from "../../lib/errors.js";
import { getLogger } from "../../lib/logger.js";
import { prisma } from "../../lib/prisma.js";

const log = getLogger("auth");

export class AuthService {
  constructor(private readonly app: FastifyInstance) {}

  async login(input: LoginRequest): Promise<LoginResponse> {
    const email = input.email.toLowerCase();
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      log.warn({ email }, "Login failed: user not found");
      throw new AppError("Invalid email or password", 401, "INVALID_CREDENTIALS");
    }

    const isValid = await bcrypt.compare(input.password, user.passwordHash);
    if (!isValid) {
      log.warn({ email, userId: user.id }, "Login failed: invalid password");
      throw new AppError("Invalid email or password", 401, "INVALID_CREDENTIALS");
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
}
