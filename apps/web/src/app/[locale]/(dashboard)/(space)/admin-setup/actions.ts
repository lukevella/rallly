"use server";

import { isInitialAdmin, requireUser } from "@/auth/queries";
import { prisma } from "@rallly/database";

export async function makeAdmin() {
  const user = await requireUser();

  if (!isInitialAdmin(user.email)) {
    return { success: false, error: "Unauthorized" };
  }

  await prisma.user.update({
    where: {
      id: user.id,
    },
    data: {
      role: "admin",
    },
  });

  return { success: true, error: null };
}
