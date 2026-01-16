import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/prisma/client";

export type * from "./generated/prisma/client";

const prismaClientSingleton = () => {
  const connectionString = process.env.DATABASE_URL;
  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter });
};

export type ExtendedPrismaClient = ReturnType<typeof prismaClientSingleton>;

// biome-ignore lint/suspicious/noShadowRestrictedNames: Fix this later
declare const globalThis: {
  prismaGlobal: ExtendedPrismaClient;
} & typeof global;

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

export { prisma };

if (process.env.NODE_ENV !== "production") globalThis.prismaGlobal = prisma;
