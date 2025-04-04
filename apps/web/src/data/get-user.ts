import { prisma } from "@rallly/database";
import { redirect } from "next/navigation";
import { cache } from "react";

import { requireUser } from "@/next-auth";

export const getUser = cache(async () => {
  const { userId } = await requireUser();

  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      locale: true,
      timeZone: true,
      subscription: {
        select: {
          active: true,
        },
      },
    },
  });

  if (!user) {
    redirect("/api/auth/invalid-session");
  }

  return user;
});
