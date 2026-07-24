import type { AuthUser, LoginRequest, LoginResponse, UserRole } from "@socios/shared";
import bcrypt from "bcryptjs";
import type { FastifyInstance } from "fastify";
import { AppError } from "../../lib/errors.js";
import { prisma } from "../../lib/prisma.js";

export class AuthService {
  constructor(private readonly app: FastifyInstance) {}

  async login(input: LoginRequest): Promise<LoginResponse> {
    const user = await prisma.user.findUnique({ where: { email: input.email.toLowerCase() } });

    if (!user) {
      throw new AppError("Invalid email or password", 401, "INVALID_CREDENTIALS");
    }

    const isValid = await bcrypt.compare(input.password, user.passwordHash);
    if (!isValid) {
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

    return { token, user: authUser };
  }
}
