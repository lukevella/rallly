"use server";

import { hasAdmins } from "@/features/user/queries";
import { requireUser } from "@/next-auth";
import { prisma } from "@rallly/database";

export async function makeAdmin() {
  if (await hasAdmins()) {
    return;
  }

  const { userId } = await requireUser();

  await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      role: "admin",
    },
  });
}
