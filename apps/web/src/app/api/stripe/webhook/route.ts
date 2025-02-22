import type { Stripe } from "@rallly/billing";
import { stripe } from "@rallly/billing";
import { withPosthog } from "@rallly/posthog/server";
import * as Sentry from "@sentry/nextjs";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { getEventHandler } from "./handlers";

export const POST = withPosthog(async (request: NextRequest) => {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature")!;
  const stripeSigningSecret = process.env.STRIPE_SIGNING_SECRET;

  if (!stripeSigningSecret) {
    Sentry.captureException(new Error("STRIPE_SIGNING_SECRET is not set"));
    return NextResponse.json(
      { error: "STRIPE_SIGNING_SECRET is not set" },
      { status: 500 },
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, stripeSigningSecret);
  } catch (err) {
    Sentry.captureException(err);
    return NextResponse.json(
      { error: `Webhook Error: Failed to construct event` },
      { status: 400 },
    );
  }

  try {
    const handler = getEventHandler(event.type);

    if (!handler) {
      Sentry.captureException(new Error(`Unhandled event type: ${event.type}`));
      return NextResponse.json(
        { error: "Unhandled event type" },
        { status: 400 },
      );
    }

    await handler(event);

    return NextResponse.json({ received: true });
  } catch (err) {
    Sentry.captureException(err);
    return NextResponse.json(
      {
        error: `Webhook Error: ${err instanceof Error ? err.message : "Unknown error"}`,
      },
      { status: 400 },
    );
  }
});
