"use server";

import { rateLimit } from "@/features/rate-limit";
import { prisma } from "@rallly/database";
import { licensingClient } from "../client";

export async function validateLicenseKey(key: string) {
  const { success } = await rateLimit("validate_license_key", 10, "1 m");

  if (!success) {
    throw new Error("Rate limit exceeded");
  }

  const { data, error } = await licensingClient.validateLicenseKey({
    key,
  });

  if (error) {
    throw new Error(`License validation failed: ${error}`);
  }

  if (!data) {
    return {
      valid: false,
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
  };
}
