import { stripe } from "@rallly/billing";
import { prisma } from "@rallly/database";
import { posthog } from "@rallly/posthog/server";
import * as Sentry from "@sentry/nextjs";
import { waitUntil } from "@vercel/functions";
import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { auth } from "@/next-auth";
import { decryptToken } from "@/utils/session";

type EmailChangePayload = {
  userId: string;
  toEmail: string;
};

const COOKIE_CONFIG = {
  path: "/",
  httpOnly: false,
  secure: false,
  expires: new Date(Date.now() + 5 * 1000), // 5 seconds
} as const;

const setEmailChangeCookie = async (type: "success" | "error", value = "1") => {
  (await cookies()).set(`email-change-${type}`, value, COOKIE_CONFIG);
};

const handleEmailChange = async (token: string) => {
  const payload = await decryptToken<EmailChangePayload>(token);

  if (!payload) {
    await setEmailChangeCookie("error", "invalidToken");
    return false;
  }

  const user = await prisma.user.update({
    where: { id: payload.userId },
    data: { email: payload.toEmail },
    select: {
      customerId: true,
    },
  });

  posthog?.capture({
    event: "account_email_change_complete",
    distinctId: payload.userId,
    properties: {
      $set: {
        email: payload.toEmail,
      },
    },
  });

  try {
    if (user.customerId) {
      await stripe.customers.update(user.customerId, {
        email: payload.toEmail,
      });
    }
  } catch (error) {
    Sentry.captureException(error);
  }

  await setEmailChangeCookie("success");

  if (posthog) {
    waitUntil(posthog.flush());
  }

  return true;
};

export const GET = async (request: NextRequest) => {
  const token = request.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.json({ error: "No token provided" }, { status: 400 });
  }

  const session = await auth();

  if (!session?.user || !session.user.email) {
    return NextResponse.redirect(
      new URL(`/login?redirectTo=${request.url}`, request.url),
    );
  }

  await handleEmailChange(token);

  return NextResponse.redirect(new URL("/settings/profile", request.url));
};
