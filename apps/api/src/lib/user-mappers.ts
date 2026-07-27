import type { User } from "@prisma/client";
import type { BackofficeUser, UserRole } from "@socios/shared";

export function toBackofficeUserDto(user: User): BackofficeUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role as UserRole,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}
