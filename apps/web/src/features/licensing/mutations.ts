import "server-only";

import { prisma } from "@rallly/database";
import { generateLicenseKey } from "@/features/licensing/helpers/generate-license-key";
import type { CreateLicenseInput } from "@/features/licensing/schema";

export async function createLicense({
  type,
  seats,
  expiresAt,
  licenseeEmail,
  licenseeName,
  version,
  idempotencyKey,
}: CreateLicenseInput) {
  const data = {
    licenseKey: generateLicenseKey({ version }),
    version,
    type,
    seats,
    issuedAt: new Date(),
    expiresAt,
    licenseeEmail,
    licenseeName,
  };

  // Upsert with an empty update so concurrent requests with the same key
  // atomically resolve to the existing license instead of racing the insert
  const license = idempotencyKey
    ? await prisma.license.upsert({
        where: { idempotencyKey },
        update: {},
        create: { ...data, idempotencyKey },
      })
    : await prisma.license.create({ data });

  return { key: license.licenseKey };
}

export async function validateLicenseKey({
  key,
  fingerprint,
  ipAddress,
  userAgent,
}: {
  key: string;
  fingerprint?: string;
  ipAddress?: string;
  userAgent?: string;
}) {
  const license = await prisma.license.findUnique({
    where: {
      licenseKey: key,
    },
    select: {
      id: true,
      licenseKey: true,
      status: true,
      issuedAt: true,
      expiresAt: true,
      licenseeEmail: true,
      licenseeName: true,
      seats: true,
      type: true,
      version: true,
      whiteLabelAddon: true,
    },
  });

  if (!license) {
    return { valid: false as const, error: "not_found" as const };
  }

  if (license.status !== "ACTIVE") {
    return { valid: false as const, error: "not_active" as const };
  }

  if (license.expiresAt && license.expiresAt < new Date()) {
    return { valid: false as const, error: "expired" as const };
  }

  await prisma.licenseValidation.create({
    data: {
      licenseId: license.id,
      ipAddress,
      fingerprint,
      validatedAt: new Date(),
      userAgent,
    },
  });

  return {
    valid: true as const,
    license: {
      key: license.licenseKey,
      valid: license.status === "ACTIVE",
      status: license.status,
      issuedAt: license.issuedAt,
      expiresAt: license.expiresAt,
      licenseeEmail: license.licenseeEmail,
      licenseeName: license.licenseeName,
      seats: license.seats,
      type: license.type,
      version: license.version,
      whiteLabelAddon: license.whiteLabelAddon,
    },
  };
}
