import { PrismaClient } from "@prisma/client";

declare global {
  // allow global `var` declarations
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

export const prisma = global.prisma || new PrismaClient();

prisma.$use(async (params, next) => {
  // We use middleware to handle soft deletes
  // See: https://www.prisma.io/docs/concepts/components/prisma-client/middleware/soft-delete-middleware
  if (params.model === "Poll") {
    if (params.action === "delete") {
      // Delete queries
      // Change action to an update
      params.action = "update";
      params.args["data"] = { deleted: true };
    }
    if (params.action === "deleteMany") {
      // Delete many queries
      params.action = "updateMany";
      if (params.args.data !== undefined) {
        params.args.data["deleted"] = true;
      } else {
        params.args["data"] = { deleted: true };
      }
    }
    if (params.action === "findUnique") {
      params.action = "findFirst";
      params.args.where["deleted"] = false;
    }
  }
  return next(params);
});

if (process.env.NODE_ENV !== "production") global.prisma = prisma;
