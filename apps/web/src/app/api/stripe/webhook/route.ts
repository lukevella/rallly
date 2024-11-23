import type { Stripe } from "@rallly/billing";
import { stripe } from "@rallly/billing";
import { prisma } from "@rallly/database";
import { posthog } from "@rallly/posthog/server";
import * as Sentry from "@sentry/nextjs";
import { waitUntil } from "@vercel/functions";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";

const checkoutMetadataSchema = z.object({
  userId: z.string(),
});

const subscriptionMetadataSchema = z.object({
  userId: z.string(),
});

function toDate(date: number) {
  return new Date(date * 1000);
}

export async function POST(request: NextRequest) {
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

  switch (event.type) {
    case "checkout.session.completed": {
      const checkoutSession = event.data.object as Stripe.Checkout.Session;

      if (checkoutSession.subscription === null) {
        // This is a one-time payment (probably for Rallly Self-Hosted)
        break;
      }

      const { userId } = checkoutMetadataSchema.parse(checkoutSession.metadata);

      if (!userId) {
        return NextResponse.json(
          { error: "Missing client reference ID" },
          { status: 400 },
        );
      }

      await prisma.user.update({
        where: {
          id: userId,
        },
        data: {
          customerId: checkoutSession.customer as string,
          subscriptionId: checkoutSession.subscription as string,
        },
      });

      const subscription = await stripe.subscriptions.retrieve(
        checkoutSession.subscription as string,
      );

      posthog?.capture({
        distinctId: userId,
        event: "upgrade",
        properties: {
          interval: subscription.items.data[0].plan.interval,
          $set: {
            tier: "pro",
          },
        },
      });

      break;
    }
    case "customer.subscription.deleted": {
      const { id } = event.data.object as Stripe.Subscription;
      const subscription = await stripe.subscriptions.retrieve(id);

      // void any unpaid invoices
      const invoices = await stripe.invoices.list({
        subscription: subscription.id,
        status: "open",
      });

      for (const invoice of invoices.data) {
        await stripe.invoices.voidInvoice(invoice.id);
      }

      // remove the subscription from the user
      await prisma.user.update({
        where: {
          subscriptionId: subscription.id,
        },
        data: {
          subscriptionId: null,
        },
      });
      // delete the subscription from the database
      await prisma.subscription.delete({
        where: {
          id: subscription.id,
        },
      });

      try {
        const { userId } = subscriptionMetadataSchema.parse(
          subscription.metadata,
        );

        posthog?.capture({
          distinctId: userId,
          event: "subscription cancel",
          properties: {
            $set: {
              tier: "hobby",
            },
          },
        });
      } catch (e) {
        Sentry.captureException(e);
      }

      break;
    }
    case "customer.subscription.updated":
    case "customer.subscription.created": {
      const { id } = event.data.object as Stripe.Subscription;

      const subscription = await stripe.subscriptions.retrieve(id);

      // check if the subscription is active
      const isActive =
        subscription.status === "active" ||
        subscription.status === "trialing" ||
        subscription.status === "past_due";

      // get the subscription price details
      const lineItem = subscription.items.data[0];

      // update/create the subscription in the database
      const { price } = lineItem;

      await prisma.subscription.upsert({
        where: {
          id: subscription.id,
        },
        create: {
          id: subscription.id,
          active: isActive,
          priceId: price.id,
          currency: subscription.currency ?? null,
          createdAt: toDate(subscription.created),
          periodStart: toDate(subscription.current_period_start),
          periodEnd: toDate(subscription.current_period_end),
        },
        update: {
          active: isActive,
          priceId: price.id,
          currency: subscription.currency ?? null,
          createdAt: toDate(subscription.created),
          periodStart: toDate(subscription.current_period_start),
          periodEnd: toDate(subscription.current_period_end),
        },
      });

      try {
        const res = subscriptionMetadataSchema.safeParse(subscription.metadata);

        if (!res.success) {
          return NextResponse.json(
            { error: "Missing user ID" },
            { status: 400 },
          );
        }

        posthog?.capture({
          event: "subscription change",
          distinctId: res.data.userId,
          properties: {
            type: event.type,
            $set: {
              tier: isActive ? "pro" : "hobby",
            },
          },
        });
      } catch (e) {
        Sentry.captureException(e);
      }

      break;
    }
    default:
      Sentry.captureException(new Error(`Unhandled event type: ${event.type}`));
      // Unexpected event type
      return NextResponse.json(
        { error: "Unhandled event type" },
        { status: 400 },
      );
  }

  waitUntil(Promise.all([posthog?.shutdown()]));

  return NextResponse.json({ received: true }, { status: 200 });
}
