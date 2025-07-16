"use server";

import { prisma } from "@rallly/database";
import { rateLimit } from "@/features/rate-limit";
import { licenseManager } from "../server";

export async function validateLicenseKey(key: string) {
  const { success } = await rateLimit("validate_license_key", 10, "1 m");

  if (!success) {
    return {
      valid: false,
      error: "Rate limit exceeded" as const,
    };
  }

  const { data } = await licenseManager.validateLicenseKey({
    key,
  });

  if (!data) {
    return {
      valid: false,
      error: "Invalid license key" as const,
    };
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
    },
  });

  return {
    valid: true,
    error: null,
  };
}
