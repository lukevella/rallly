"use server";

import { prisma } from "@rallly/database";
import { cookies, headers } from "next/headers";
import * as z from "zod";
import { AppError } from "@/lib/errors";
import { createRatelimit } from "@/lib/rate-limit";
import { actionClient } from "@/lib/safe-action/server";

export async function setVerificationEmail(email: string) {
  const cookieStore = await cookies();

  cookieStore.set("verification-email", email, {
    httpOnly: true,
    secure: process.env.NEXT_PUBLIC_BASE_URL?.startsWith("https://"),
    sameSite: "lax",
    maxAge: 15 * 60,
  });
}

export const getLoginMethodAction = actionClient
  .metadata({ actionName: "get_login_method" })
  .inputSchema(z.object({ email: z.email() }))
  .action(async ({ parsedInput: { email } }) => {
    const ratelimit = createRatelimit(10, "1 m");

    if (ratelimit) {
      const headersList = await headers();
      const ipAddress = headersList.get("x-forwarded-for");

      const { success } = await ratelimit.limit(
        `get_login_method:${ipAddress}`,
      );

      if (!success) {
        throw new AppError({
          code: "TOO_MANY_REQUESTS",
          message: "Too many requests",
        });
      }
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
      return { method: "credential" as const };
    }

    return { method: "email" as const };
  });
