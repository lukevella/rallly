import * as Sentry from "@sentry/nextjs";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { createStripePortalSession } from "@/features/billing/mutations";
import { subscriptionCheckoutMetadataSchema } from "@/features/billing/schema";
import { getStripe } from "@/features/billing/service";
import { getSession } from "@/lib/auth";

/**
 * Checkout return endpoint. Stripe redirects the browser here after payment
 * (success_url) with a session_id, which lets us resolve the customer before
 * the webhook has written customerId to the user. UI-initiated portal opens
 * go through openCustomerPortalAction instead.
 */
export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get("session_id");

  if (!sessionId) {
    return NextResponse.json({ error: "Missing session_id" }, { status: 400 });
  }

  const userSession = await getSession();

  if (!userSession?.user || userSession.user.isGuest) {
    return NextResponse.redirect(
      new URL("/login", request.nextUrl.origin).toString(),
    );
  }

  let customerId: string;

  try {
    const session = await getStripe().checkout.sessions.retrieve(sessionId);

    const metadata = subscriptionCheckoutMetadataSchema.safeParse(
      session.metadata,
    );

    if (!metadata.success || metadata.data.userId !== userSession.user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

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

  try {
    return NextResponse.redirect(
      await createStripePortalSession({ customerId }),
    );
  } catch (error) {
    Sentry.captureException(error);
    return NextResponse.json(
      { error: "Failed to create portal session" },
      { status: 500 },
    );
  }
}
