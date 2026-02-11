import path from "node:path";
import { defineConfig } from "prisma/config";

process.loadEnvFile(path.join(__dirname, "../../.env"));

export default defineConfig({
  schema: path.join(__dirname, "prisma"),
  migrations: {
    path: path.join(__dirname, "prisma/migrations"),
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: process.env.DIRECT_DATABASE_URL || process.env.DATABASE_URL,
  },
});
