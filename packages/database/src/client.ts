import { PrismaClient } from "@prisma/client";

export type * from "@prisma/client";

const prismaClientSingleton = () => {
  return new PrismaClient();
};

export type ExtendedPrismaClient = ReturnType<typeof prismaClientSingleton>;

declare const globalThis: {
  prismaGlobal: ExtendedPrismaClient;
} & typeof global;

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

export { prisma };

if (process.env.NODE_ENV !== "production") globalThis.prismaGlobal = prisma;
