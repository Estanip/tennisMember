import type { Prisma } from "@prisma/client";
import type {
  BackofficeUser,
  CreateUserRequest,
  PaginatedUsers,
  UpdateUserRequest,
  UserListQuery,
  UserRole,
} from "@socios/shared";
import {
  isUserRole,
  isValidUserName,
  isValidUsername,
  isValidUserPassword,
  normalizeMemberEmail,
  normalizeOptionalUsername,
  USER_ROLES,
} from "@socios/shared";
import bcrypt from "bcryptjs";
import { AppError } from "../../lib/errors.js";
import { getLogger } from "../../lib/logger.js";
import { prisma } from "../../lib/prisma.js";
import { toBackofficeUserDto } from "../../lib/user-mappers.js";

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 100;
const BCRYPT_ROUNDS = 10;

const log = getLogger("users");

export class UserService {
  async list(query: UserListQuery): Promise<PaginatedUsers> {
    const page = Math.max(query.page ?? DEFAULT_PAGE, 1);
    const pageSize = Math.min(Math.max(query.pageSize ?? DEFAULT_PAGE_SIZE, 1), MAX_PAGE_SIZE);
    const search = query.search?.trim();

    const where: Prisma.UserWhereInput = search
      ? {
          OR: [
            { email: { contains: search, mode: "insensitive" } },
            { username: { contains: search, mode: "insensitive" } },
            { name: { contains: search, mode: "insensitive" } },
          ],
        }
      : {};

    const [items, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: [{ name: "asc" }, { email: "asc" }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.user.count({ where }),
    ]);

    log.debug({ page, pageSize, total, search: search || undefined }, "Listed users");

    return {
      items: items.map(toBackofficeUserDto),
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    };
  }

  async getById(id: string): Promise<BackofficeUser> {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      log.warn({ userId: id }, "User not found");
      throw new AppError("User not found", 404, "USER_NOT_FOUND");
    }
    return toBackofficeUserDto(user);
  }

  async create(input: CreateUserRequest): Promise<BackofficeUser> {
    const email = normalizeMemberEmail(input.email);
    const name = input.name.trim();
    const password = input.password;
    const username = this.resolveUsername(input.username);

    if (!isValidUserName(name)) {
      throw new AppError("Name must be between 2 and 80 characters", 400, "INVALID_NAME");
    }
    if (!isValidUserPassword(password)) {
      throw new AppError("Password must be at least 8 characters", 400, "INVALID_PASSWORD");
    }
    if (!isUserRole(input.role)) {
      throw new AppError("Invalid role", 400, "INVALID_ROLE");
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      log.warn({ email }, "Create user rejected: email taken");
      throw new AppError("Email already in use", 409, "EMAIL_TAKEN");
    }

    await this.assertUsernameAvailable(username);

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const user = await prisma.user.create({
      data: {
        email,
        username,
        name,
        passwordHash,
        role: input.role,
      },
    });

    const dto = toBackofficeUserDto(user);
    log.info({ userId: dto.id, email, username, role: dto.role }, "User created");
    return dto;
  }

  async update(id: string, input: UpdateUserRequest, actorId: string): Promise<BackofficeUser> {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      log.warn({ userId: id }, "Update user failed: not found");
      throw new AppError("User not found", 404, "USER_NOT_FOUND");
    }

    const nextName = input.name !== undefined ? input.name.trim() : user.name;
    const nextRole: UserRole = input.role !== undefined ? input.role : (user.role as UserRole);
    const nextUsername =
      input.username !== undefined ? this.resolveUsername(input.username) : user.username;

    if (input.name !== undefined && !isValidUserName(nextName)) {
      throw new AppError("Name must be between 2 and 80 characters", 400, "INVALID_NAME");
    }
    if (input.password !== undefined && !isValidUserPassword(input.password)) {
      throw new AppError("Password must be at least 8 characters", 400, "INVALID_PASSWORD");
    }
    if (input.role !== undefined && !isUserRole(input.role)) {
      throw new AppError("Invalid role", 400, "INVALID_ROLE");
    }

    await this.assertCanChangeRole(user.id, user.role, nextRole, actorId);

    if (input.username !== undefined) {
      await this.assertUsernameAvailable(nextUsername, id);
    }

    const data: Prisma.UserUpdateInput = {
      name: nextName,
      role: nextRole,
      username: nextUsername,
    };

    if (input.password) {
      data.passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);
    }

    const updated = await prisma.user.update({
      where: { id },
      data,
    });

    const dto = toBackofficeUserDto(updated);
    log.info({ userId: id, role: dto.role, actorId }, "User updated");
    return dto;
  }

  private resolveUsername(value: string | null | undefined): string | null {
    const normalized = normalizeOptionalUsername(value);
    if (normalized === null) {
      return null;
    }
    if (!isValidUsername(normalized)) {
      throw new AppError(
        "Username must be 3-30 characters, start with a letter, and use only lowercase letters, numbers, dots, underscores or hyphens",
        400,
        "INVALID_USERNAME",
      );
    }
    return normalized;
  }

  private async assertUsernameAvailable(
    username: string | null,
    excludeUserId?: string,
  ): Promise<void> {
    if (!username) {
      return;
    }

    const existing = await prisma.user.findUnique({ where: { username } });
    if (existing && existing.id !== excludeUserId) {
      log.warn({ username }, "Username already in use");
      throw new AppError("Username already in use", 409, "USERNAME_TAKEN");
    }
  }

  private async assertCanChangeRole(
    targetUserId: string,
    currentRole: string,
    nextRole: UserRole,
    actorId: string,
  ): Promise<void> {
    if (nextRole === currentRole) {
      return;
    }

    if (currentRole === USER_ROLES.SUPER_ADMIN && nextRole !== USER_ROLES.SUPER_ADMIN) {
      const superAdminCount = await prisma.user.count({
        where: { role: USER_ROLES.SUPER_ADMIN },
      });
      if (superAdminCount <= 1) {
        throw new AppError("Cannot remove the last super admin", 400, "LAST_SUPER_ADMIN");
      }
      if (targetUserId === actorId) {
        throw new AppError(
          "Cannot change your own role as the last super admin",
          400,
          "LAST_SUPER_ADMIN",
        );
      }
    }
  }
}
