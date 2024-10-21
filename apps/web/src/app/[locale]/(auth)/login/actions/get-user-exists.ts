"use server";

import { prisma } from "@rallly/database";
import { cookies } from "next/headers";

export async function getUserExists(email: string) {
  const count = await prisma.user.count({
    where: {
      email,
    },
  });
  if (count > 0) {
    // set email as a session cookie
    cookies().set("verification-email", email);
  }

  return count > 0;
}
