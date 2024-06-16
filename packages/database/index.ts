import { PrismaClient } from "@prisma/client";

const prismaClientSingleton = () => {
  return new PrismaClient().$extends({
    query: {
      poll: {
        findMany: ({ args, query }) => {
          if (args.where?.deleted === undefined) {
            args.where = { ...args.where, deleted: false };
          }

          return query(args);
        },
      },
    },
  });
};

declare const globalThis: {
  prismaGlobal: ReturnType<typeof prismaClientSingleton>;
} & typeof global;

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

export { prisma };

if (process.env.NODE_ENV !== "production") globalThis.prismaGlobal = prisma;
