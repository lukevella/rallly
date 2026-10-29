import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

export type * from "../generated/prisma/client";
export { Prisma } from "../generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter: new PrismaPg({
      connectionString: process.env.DATABASE_URL,
      // Overdue idle timers fire when a suspended Fluid instance resumes, so
      // pg's 10s default empties the pool after any longer gap between
      // requests. Stays well under the ~350s AWS NAT idle cut-off.
      idleTimeoutMillis: 60_000,
    }),
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
