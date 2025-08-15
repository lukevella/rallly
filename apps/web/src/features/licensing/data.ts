import { prisma } from "@rallly/database";
import { cache } from "react";

export function getInstanceLicense() {
  return prisma.instanceLicense.findFirst({
    orderBy: {
      id: "asc",
    },
  });
}

export const loadInstanceLicense = cache(async () => {
  const license = await getInstanceLicense();

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
