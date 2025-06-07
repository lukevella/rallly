"use server";

import { requireAdmin } from "@/auth/queries";
import { prisma } from "@rallly/database";
import { z } from "zod";

const inputSchema = z.object({
  userId: z.string(),
  role: z.enum(["admin", "user"]),
});

export async function changeRole(input: z.infer<typeof inputSchema>) {
  await requireAdmin();
  const { userId, role } = inputSchema.parse(input);
  await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      role,
    },
  });
}

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
