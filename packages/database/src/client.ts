import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

export type * from "../generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

// When set (e.g. `rallly` in the shared Supabase project), Rallly's tables
// live in a dedicated Postgres schema, isolated from other apps sharing the
// database. Left unset locally so development uses the default `public` schema.
const schema = process.env.DATABASE_SCHEMA;

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter: new PrismaPg(
      { connectionString: process.env.DATABASE_URL },
      schema ? { schema } : undefined,
    ),
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
