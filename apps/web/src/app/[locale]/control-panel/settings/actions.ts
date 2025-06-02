"use server";

import { requireAdmin } from "@/auth/queries";
import { prisma } from "@rallly/database";

export async function setDisableUserRegistration({
  disableUserRegistration,
}: {
  disableUserRegistration: boolean;
}) {
  await requireAdmin();

  await prisma.instanceSettings.update({
    where: {
      id: 1,
    },
    data: {
      disableUserRegistration,
    },
  });
}
