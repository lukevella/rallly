import { PrismaClient } from "@prisma/client";

export type * from "@prisma/client";

const prismaClientSingleton = () => {
  return new PrismaClient().$extends({
    query: {
      poll: {
        findMany: ({ args, query }) => {
          if (!args.where?.deleted) {
            args.where = { ...args.where, deleted: false };
          }

          return query(args);
        },
      },
    },
  });
};

export type ExtendedPrismaClient = ReturnType<typeof prismaClientSingleton>;

declare const globalThis: {
  prismaGlobal: ExtendedPrismaClient;
} & typeof global;

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

export { prisma };

if (process.env.NODE_ENV !== "production") globalThis.prismaGlobal = prisma;
