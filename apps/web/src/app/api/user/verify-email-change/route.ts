import { stripe } from "@rallly/billing";
import { prisma } from "@rallly/database";
import { posthog } from "@rallly/posthog/server";
import * as Sentry from "@sentry/nextjs";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { decryptToken } from "@/utils/session";

type EmailChangePayload = {
  userId: string;
  toEmail: string;
};

export const GET = async (request: NextRequest) => {
  const token = request.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.json({ error: "No token provided" }, { status: 400 });
  }

  const session = await getSession();

  if (!session?.user || session.user.isGuest) {
    return NextResponse.redirect(
      new URL(`/login?redirectTo=${request.url}`, request.url),
    );
  }

  const payload = await decryptToken<EmailChangePayload>(token);

  if (!payload) {
    return NextResponse.redirect(
      new URL("/settings/profile?error=invalidToken", request.url),
    );
  }

  if (payload.userId !== session.user.id) {
    return NextResponse.redirect(
      new URL("/settings/profile?error=invalidUserId", request.url),
    );
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

  posthog?.capture({
    event: "account_email_change_complete",
    distinctId: session.user.id,
    properties: {
      $set: {
        email: payload.toEmail,
      },
    },
  });

  return NextResponse.redirect(
    new URL("/settings/profile?emailChanged=true", request.url),
  );
};
