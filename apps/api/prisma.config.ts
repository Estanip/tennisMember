import { config } from "dotenv";
import { defineConfig } from "prisma/config";

config();

const { DATABASE_URL } = process.env;

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: DATABASE_URL as string,
  },
});
