"use server";

import { prisma } from "@rallly/database";
import { cookies } from "next/headers";

export async function setVerificationEmail(email: string) {
  const cookieStore = await cookies();

  cookieStore.set("verification-email", email, {
    httpOnly: true,
    secure: process.env.NEXT_PUBLIC_BASE_URL?.startsWith("https://"),
    sameSite: "lax",
    maxAge: 15 * 60,
  });
}

export async function getLoginMethod(email: string) {
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      accounts: true,
    },
  });

  if (
    user?.emailVerified &&
    user?.accounts.some((account) => account.provider === "credential")
  ) {
    return { data: "credential" as const, error: null };
  }

  return { data: "email" as const, error: null };
}
