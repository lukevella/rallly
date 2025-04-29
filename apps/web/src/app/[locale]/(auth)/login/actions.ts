"use server";

import { prisma } from "@rallly/database";
import { cookies } from "next/headers";

export async function setVerificationEmail(email: string) {
  const user = await prisma.user.findUnique({
    where: {
      email,
    },
    select: {
      email: true,
    },
  });

  if (user) {
    (await cookies()).set("verification-email", user.email, {
      httpOnly: true,
      secure: process.env.NEXT_PUBLIC_BASE_URL?.startsWith("https://"),
      sameSite: "lax",
      maxAge: 15 * 60,
    });
    return true;
  }

  return false;
}
