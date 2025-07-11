import { stripe } from "@rallly/billing";
import { prisma } from "@rallly/database";
import { absoluteUrl } from "@rallly/utils/absolute-url";
import * as Sentry from "@sentry/nextjs";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { auth } from "@/next-auth";

export function createStripePortalSessionHandler(path = "") {
  return async (request: NextRequest) => {
    const sessionId = request.nextUrl.searchParams.get("session_id");
    const returnPath =
      request.nextUrl.searchParams.get("return_path") ?? "/account/billing";

    let customerId: string | undefined;

    if (sessionId) {
      try {
        const session = await stripe.checkout.sessions.retrieve(sessionId);
        if (typeof session.customer !== "string") {
          Sentry.captureException(new Error("Invalid customer ID in session"));
          return NextResponse.json(
            { error: "Invalid customer ID in session" },
            { status: 400 },
          );
        }
        customerId = session.customer;
      } catch (error) {
        Sentry.captureException(error);
        return NextResponse.json(
          { error: "Failed to retrieve session" },
          { status: 500 },
        );
      }
    } else {
      const userSession = await auth();
      if (!userSession?.user || userSession.user.email === null) {
        const url = new URL("/login", request.url);
        url.searchParams.set("redirectTo", request.nextUrl.pathname);
        return NextResponse.redirect(url, 302);
      }
      try {
        const user = await prisma.user.findUnique({
          where: {
            id: userSession.user.id,
          },
          select: {
            customerId: true,
          },
        });
        customerId = user?.customerId ?? undefined;
      } catch (error) {
        Sentry.captureException(error);
        return NextResponse.json(
          { error: "Failed to retrieve user" },
          { status: 500 },
        );
      }
    }

    if (!customerId) {
      return NextResponse.json({
        error: "No customer ID found",
      });
    }

    try {
      const portalSession = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: returnPath ? absoluteUrl(returnPath) : undefined,
      });
      return NextResponse.redirect(portalSession.url + path);
    } catch (error) {
      Sentry.captureException(error);
      return NextResponse.json(
        { error: "Failed to create portal session" },
        { status: 500 },
      );
    }
  };
}
