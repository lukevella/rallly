"use server";

import { prisma } from "@rallly/database";
import { revalidateTag } from "next/cache";
import { INSTANCE_LICENSE_TAG } from "@/features/licensing/constants";
import { validateLicenseKeyInputSchema } from "@/features/licensing/schema";
import { AppError } from "@/lib/errors";
import { adminActionClient } from "@/lib/safe-action/server";
import { licenseManager } from "./server";

export const removeInstanceLicenseAction = adminActionClient
  .metadata({
    actionName: "remove_instance_license",
  })
  .action(async () => {
    try {
      await prisma.instanceLicense.deleteMany();
      revalidateTag(INSTANCE_LICENSE_TAG);
    } catch (_error) {
      return {
        success: false,
        message: "Failed to delete license",
      };
    }

    return {
      success: true,
      message: "License deleted successfully",
    };
  });

export const refreshInstanceLicenseAction = adminActionClient
  .metadata({
    actionName: "refresh_instance_license",
  })
  .action(async () => {
    try {
      const instanceLicense = await prisma.instanceLicense.findFirst({
        orderBy: {
          id: "asc",
        },
      });

      if (!instanceLicense) {
        return {
          success: false,
          message: "No license found to refresh",
        };
      }

      const { data } = await licenseManager.validateLicenseKey({
        key: instanceLicense.licenseKey,
      });

      if (!data) {
        throw new AppError({
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

      revalidateTag(INSTANCE_LICENSE_TAG);

      return {
        success: true,
        message: "License refreshed successfully",
      };
    } catch (_error) {
      console.error(_error);
      throw new AppError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to validate license",
      });
    }
  });

export const validateLicenseKeyAction = adminActionClient
  .metadata({
    actionName: "validate_license_key",
  })
  .inputSchema(validateLicenseKeyInputSchema)
  .action(async ({ parsedInput }) => {
    const { data } = await licenseManager.validateLicenseKey(parsedInput);
    if (!data) {
      throw new AppError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to validate license",
      });
    }

    await prisma.instanceLicense.create({
      data: {
        licenseKey: data.key,
        licenseeName: data.licenseeName,
        licenseeEmail: data.licenseeEmail,
        issuedAt: data.issuedAt,
        expiresAt: data.expiresAt,
        seats: data.seats,
        type: data.type,
        whiteLabelAddon: data.whiteLabelAddon,
      },
    });

    return {
      valid: true,
    };
  });
