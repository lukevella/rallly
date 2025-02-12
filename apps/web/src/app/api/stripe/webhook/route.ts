import type { Stripe } from "@rallly/billing";
import { stripe } from "@rallly/billing";
import { prisma } from "@rallly/database";
import { posthog } from "@rallly/posthog/server";
import * as Sentry from "@sentry/nextjs";
import { waitUntil } from "@vercel/functions";
import { kv } from "@vercel/kv";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";

import { getEmailClient } from "@/utils/emails";

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

      const res = subscriptionMetadataSchema.safeParse(subscription.metadata);

      if (!res.success) {
        return NextResponse.json({ error: "Missing user ID" }, { status: 400 });
      }

      // create or update the subscription in the database
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

      // update the user with the subscription id
      await prisma.user.update({
        where: {
          id: res.data.userId,
        },
        data: {
          subscriptionId: subscription.id,
        },
      });

      try {
        posthog?.capture({
          distinctId: res.data.userId,
          event: "subscription change",
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
    case "checkout.session.expired": {
      console.info("Checkout session expired");
      const session = event.data.object as Stripe.Checkout.Session;
      // When a Checkout Session expires, the customer's email isn't returned in
      // the webhook payload unless they give consent for promotional content
      const email = session.customer_details?.email;
      const recoveryUrl = session.after_expiration?.recovery?.url;
      const userId = session.metadata?.userId;
      if (!userId) {
        console.info("No user ID found in Checkout Session metadata");
        Sentry.captureMessage("No user ID found in Checkout Session metadata");
        break;
      }
      // Do nothing if the Checkout Session has no email or recovery URL
      if (!email || !recoveryUrl) {
        console.info("No email or recovery URL found in Checkout Session");
        Sentry.captureMessage(
          "No email or recovery URL found in Checkout Session",
        );
        break;
      }
      const promoEmailKey = `promo_email_sent:${email}`;
      // Track that a promotional email opportunity has been shown to this user
      const hasReceivedPromo = await kv.get(promoEmailKey);
      console.info("Has received promo", hasReceivedPromo);

      const user = await prisma.user.findUnique({
        where: {
          id: userId,
        },
        select: {
          locale: true,
          subscription: {
            select: {
              active: true,
            },
          },
        },
      });

      const isPro = !!user?.subscription?.active;

      // Avoid spamming people who abandon Checkout multiple times
      if (user && !hasReceivedPromo && !isPro) {
        console.info("Sending abandoned checkout email");
        // Set the flag with a 30-day expiration (in seconds)
        await kv.set(promoEmailKey, 1, { ex: 30 * 24 * 60 * 60, nx: true });
        getEmailClient(user.locale ?? undefined).sendTemplate(
          "AbandonedCheckoutEmail",
          {
            to: email,
            from: {
              name: "Luke from Rallly",
              address: "luke@rallly.co",
            },
            props: {
              name: session.customer_details?.name ?? undefined,
              discount: 20,
              couponCode: "GETPRO1Y20",
              recoveryUrl,
            },
          },
        );
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
