import { prisma } from "@rallly/database";
import { unstable_cache } from "next/cache";
import { cache } from "react";
import { INSTANCE_LICENSE_TAG } from "@/features/licensing/constants";
import { getUserCount } from "@/features/user/queries";
import { isSelfHosted } from "@/utils/constants";

export function getInstanceLicense() {
  return prisma.instanceLicense.findFirst({
    orderBy: {
      id: "asc",
    },
  });
}

export const cached_getInstanceLicense = unstable_cache(
  getInstanceLicense,
  [],
  {
    tags: [INSTANCE_LICENSE_TAG],
  },
);

export const loadInstanceLicense = cache(async () => {
  const license = await cached_getInstanceLicense();

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
      license.seats ??
      (license.type === "ENTERPRISE" ? Number.POSITIVE_INFINITY : 1),
    type: license.type,
    whiteLabelAddon: license.whiteLabelAddon,
  };
});

export const didExceedLicenseLimit = async () => {
  if (!isSelfHosted) {
    return false;
  }

  const license = await loadInstanceLicense();
  const userCount = await getUserCount();

  if (!license) {
    return userCount > 1;
  }

  return license.seats < userCount;
};
