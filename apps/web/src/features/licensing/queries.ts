import { prisma } from "@rallly/database";

export async function getLicense() {
  return prisma.instanceLicense.findFirst();
}
