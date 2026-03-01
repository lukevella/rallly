import { prisma } from "@rallly/database";
import { createLogger } from "@rallly/logger";
import { TRPCError } from "@trpc/server";
import { updateTag } from "next/cache";
import { INSTANCE_LICENSE_TAG } from "@/features/licensing/constants";
import { validateLicenseKeyInputSchema } from "@/features/licensing/schema";
import { licenseManager } from "@/features/licensing/server";
import { adminProcedure, router } from "../trpc";

const logger = createLogger("licensing/trpc");

export const licensing = router({
  remove: adminProcedure.mutation(async () => {
    await prisma.instanceLicense.deleteMany();
    updateTag(INSTANCE_LICENSE_TAG);
  }),
  refresh: adminProcedure.mutation(async () => {
    const instanceLicense = await prisma.instanceLicense.findFirst({
      orderBy: {
        id: "asc",
      },
    });

    if (!instanceLicense) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "No license found to refresh",
      });
    }

    try {
      const { data } = await licenseManager.validateLicenseKey({
        key: instanceLicense.licenseKey,
      });

      if (!data) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to validate license",
        });
      }

      await prisma.instanceLicense.update({
        where: {
          licenseKey: instanceLicense.licenseKey,
        },
        data: {
          licenseeName: data.licenseeName,
          licenseeEmail: data.licenseeEmail,
          issuedAt: data.issuedAt,
          expiresAt: data.expiresAt,
          seats: data.seats,
          type: data.type,
          whiteLabelAddon: data.whiteLabelAddon,
        },
      });

      updateTag(INSTANCE_LICENSE_TAG);
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }
      logger.error({ error }, "Failed to refresh license");
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to validate license",
        cause: error,
      });
    }
  }),
  validate: adminProcedure
    .input(validateLicenseKeyInputSchema)
    .mutation(async ({ input }) => {
      const { data } = await licenseManager.validateLicenseKey(input);

      if (!data) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to validate license",
        });
      }

      await prisma.instanceLicense.upsert({
        where: { licenseKey: data.key },
        create: {
          licenseKey: data.key,
          licenseeName: data.licenseeName,
          licenseeEmail: data.licenseeEmail,
          issuedAt: data.issuedAt,
          expiresAt: data.expiresAt,
          seats: data.seats,
          type: data.type,
          whiteLabelAddon: data.whiteLabelAddon,
        },
        update: {
          licenseeName: data.licenseeName,
          licenseeEmail: data.licenseeEmail,
          issuedAt: data.issuedAt,
          expiresAt: data.expiresAt,
          seats: data.seats,
          type: data.type,
          whiteLabelAddon: data.whiteLabelAddon,
        },
      });

      updateTag(INSTANCE_LICENSE_TAG);
    }),
});
