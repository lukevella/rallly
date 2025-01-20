"use server";

import { prisma } from "@rallly/database";
import { cookies } from "next/headers";

export async function setVerificationEmail(email: string) {
  const count = await prisma.user.count({
    where: {
      email,
    },
  });

  cookies().set("verification-email", email);

  return count > 0;
}
