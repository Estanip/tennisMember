import { PrismaClient } from "@prisma/client";
import { USER_ROLES } from "@socios/shared";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const passwordHash = await bcrypt.hash("Alem1916", 10);

  await prisma.user.upsert({
    where: { email: "admin@alem.com" },
    update: {
      name: "Administrador",
      passwordHash,
      role: USER_ROLES.ADMIN,
    },
    create: {
      email: "admin@alem.com",
      name: "Administrador",
      passwordHash,
      role: USER_ROLES.ADMIN,
    },
  });

  await prisma.user.upsert({
    where: { email: "user@alem.com" },
    update: {
      name: "Usuario Lectura",
      passwordHash: await bcrypt.hash("User1916", 10),
      role: USER_ROLES.USER,
    },
    create: {
      email: "user@alem.com",
      name: "Usuario Lectura",
      passwordHash: await bcrypt.hash("User1916", 10),
      role: USER_ROLES.USER,
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error: unknown) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
