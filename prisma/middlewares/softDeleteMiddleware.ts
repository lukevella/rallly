import { Prisma, PrismaClient } from "@prisma/client";

export const softDeleteMiddleware = (
  prisma: PrismaClient,
  model: Prisma.ModelName,
) => {
  prisma.$use(async (params, next) => {
    // We use middleware to handle soft deletes
    // See: https://www.prisma.io/docs/concepts/components/prisma-client/middleware/soft-delete-middleware
    if (params.model === model) {
      if (params.action === "delete") {
        // Delete queries
        // Change action to an update
        params.action = "update";
        params.args["data"] = { deleted: true, deletedAt: new Date() };
      }
      if (params.action == "deleteMany") {
        // Delete many queries
        params.action = "updateMany";
        if (params.args.data != undefined) {
          params.args.data["deleted"] = true;
        } else {
          params.args["data"] = { deleted: true, deletedAt: new Date() };
        }
      }
      if (params.action === "findFirst") {
        // Add 'deleted' filter
        // ID filter maintained
        params.args.where["deleted"] = params.args.where["deleted"] || false;
      }
    }
    return next(params);
  });
};
