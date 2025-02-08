"use server";

import { prisma } from "@rallly/database";
import { cookies } from "next/headers";

export async function setVerificationEmail(email: string) {
  const count = await prisma.user.count({
    where: {
      email,
    },
  });

  cookies().set("verification-email", email, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 15 * 60,
  });

  return count > 0;
}
