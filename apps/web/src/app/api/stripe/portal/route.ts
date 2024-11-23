import { stripe } from "@rallly/billing";
import { prisma } from "@rallly/database";
import { absoluteUrl } from "@rallly/utils/absolute-url";
import * as Sentry from "@sentry/nextjs";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { getServerSession } from "@/auth";

export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get("session_id");
  const returnPath = request.nextUrl.searchParams.get("return_path");

  let customerId: string | undefined;

  if (sessionId) {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (typeof session.customer !== "string") {
      Sentry.captureException(new Error("Invalid customer ID in session"));
      return NextResponse.redirect("/login");
    }
    customerId = session.customer;
  } else {
    const userSession = await getServerSession();
    if (!userSession || userSession.user.email === null) {
      Sentry.captureException(new Error("User not logged in"));
      return NextResponse.redirect("/login");
    }
    const user = await prisma.user.findUnique({
      where: {
        id: userSession.user.id,
      },
      select: {
        customerId: true,
      },
    });
    customerId = user?.customerId ?? undefined;
  }

  if (!customerId) {
    Sentry.captureException(new Error("Session has no customer ID"));
    return NextResponse.redirect("/login");
  }

  try {
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnPath ? absoluteUrl(returnPath) : undefined,
    });
    return NextResponse.redirect(portalSession.url);
  } catch (error) {
    Sentry.captureException(error);
    return NextResponse.redirect("/login");
  }
}
