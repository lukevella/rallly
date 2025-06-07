"use server";

import { prisma } from "@rallly/database";

import { getUserId } from "@/next-auth";

export async function updateLocale(locale: string) {
  const userId = await getUserId();
  await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      locale,
    },
  });
}
