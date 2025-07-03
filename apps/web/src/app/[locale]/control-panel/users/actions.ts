"use server";

import { requireAdmin } from "@/auth/queries";
import { prisma } from "@rallly/database";

export async function deleteUser({
  userId,
  email,
}: { userId: string; email: string }) {
  await requireAdmin();
  await prisma.user.delete({
    where: {
      id: userId,
      email,
    },
  });
}
