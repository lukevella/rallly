import { prisma } from "@rallly/database";
import { cache } from "react";

export const loadInstanceLicense = cache(async () => {
  const license = await prisma.instanceLicense.findFirst();

  if (!license) {
    return null;
  }

  return {
    licenseKey: license.licenseKey,
    licenseeName: license.licenseeName,
    licenseeEmail: license.licenseeEmail,
    issuedAt: license.issuedAt,
    expiresAt: license.expiresAt,
    seats:
      (license.seats ?? license.type === "ENTERPRISE")
        ? Number.POSITIVE_INFINITY
        : 1,
    type: license.type,
  };
});
