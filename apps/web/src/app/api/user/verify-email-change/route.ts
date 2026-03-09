import { stripe } from "@rallly/billing";
import { prisma } from "@rallly/database";
import { absoluteUrl } from "@rallly/utils/absolute-url";
import * as Sentry from "@sentry/nextjs";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { posthog } from "@/features/analytics/posthog";
import { getSession } from "@/lib/auth";
import { withPostHog } from "@/utils/posthog";
import { decryptToken } from "@/utils/session";

type EmailChangePayload = {
  userId: string;
  toEmail: string;
};

const handler = async (request: NextRequest) => {
  const token = request.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.json({ error: "No token provided" }, { status: 400 });
  }

  const session = await getSession();

  if (!session?.user || session.user.isGuest) {
    const loginUrl = new URL(absoluteUrl("/login"));
    loginUrl.searchParams.set(
      "redirectTo",
      `${request.nextUrl.pathname}${request.nextUrl.search}`,
    );
    return NextResponse.redirect(loginUrl);
  }

  const payload = await decryptToken<EmailChangePayload>(token);

  if (!payload) {
    return NextResponse.redirect(
      absoluteUrl("/settings/profile?error=invalidToken"),
    );
  }

  if (payload.userId !== session.user.id) {
    return NextResponse.redirect(
      absoluteUrl("/settings/profile?error=invalidUserId"),
    );
  }

  const user = await prisma.user.update({
    where: { id: payload.userId },
    data: { email: payload.toEmail },
    select: {
      customerId: true,
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

  posthog()?.capture({
    event: "account_email_change_complete",
    distinctId: session.user.id,
    properties: {
      $set: {
        email: payload.toEmail,
      },
    },
  });

  return NextResponse.redirect(
    absoluteUrl("/settings/profile?emailChanged=true"),
  );
};

export const GET = withPostHog(handler);
