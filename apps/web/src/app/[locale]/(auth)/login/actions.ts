"use server";

import { prisma } from "@rallly/database";
import { cookies } from "next/headers";
import { rateLimit } from "@/lib/rate-limit";

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
  const res = await rateLimit("get_login_method", 100, "1m");

  if (!res.success) {
    return { data: null, error: "TOO_MANY_REQUESTS" as const };
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      emailVerified: true,
      accounts: {
        select: {
          provider: true,
        },
      },
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
