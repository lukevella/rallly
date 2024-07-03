import type { Stripe } from "@rallly/backend/stripe";
import { stripe } from "@rallly/backend/stripe";
import { prisma } from "@rallly/database";
import * as Sentry from "@sentry/node";
import { buffer } from "micro";
import { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";

import { posthog, posthogApiHandler } from "@/app/posthog";
import { composeApiHandlers } from "@/utils/next";

export const config = {
  api: {
    bodyParser: false,
  },
};

const toDate = (date: number) => new Date(date * 1000);

const endpointSecret = process.env.STRIPE_SIGNING_SECRET as string;

const validatedWebhook = async (req: NextApiRequest) => {
  const signature = req.headers["stripe-signature"] as string;
  const buf = await buffer(req);

  try {
    return stripe.webhooks.constructEvent(buf, signature, endpointSecret);
  } catch (err) {
    return null;
  }
};

const checkoutMetadataSchema = z.object({
  userId: z.string(),
});

const subscriptionMetadataSchema = z.object({
  userId: z.string(),
});

async function stripeApiHandler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.status(405).end();
    return;
  }
  if (!endpointSecret) {
    res.status(400).send("No endpoint secret");
    return;
  }
  const event = await validatedWebhook(req);

  if (!event) {
    res.status(400).send("Invalid signature");
    return;
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
        res.status(400).send("Missing client reference ID");
        return;
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

      try {
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
      } catch (e) {
        Sentry.captureException(e);
      }

      break;
    }
    case "customer.subscription.deleted":
    case "customer.subscription.updated":
    case "customer.subscription.created": {
      const { id } = event.data.object as Stripe.Subscription;

      const subscription = await stripe.subscriptions.retrieve(id);

      // check if the subscription is active
      const isActive =
        subscription.status === "active" || subscription.status === "past_due";

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
          currency: price.currency ?? null,
          createdAt: toDate(subscription.created),
          periodStart: toDate(subscription.current_period_start),
          periodEnd: toDate(subscription.current_period_end),
        },
        update: {
          active: isActive,
          priceId: price.id,
          currency: price.currency ?? null,
          createdAt: toDate(subscription.created),
          periodStart: toDate(subscription.current_period_start),
          periodEnd: toDate(subscription.current_period_end),
        },
      });

      try {
        const data = subscriptionMetadataSchema.parse(subscription.metadata);
        posthog?.capture({
          event: "subscription change",
          distinctId: data.userId,
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
      // Unexpected event type
      res.status(400).json({
        error: "Unhandled event type",
      });
  }

  res.end();
}

export default composeApiHandlers(stripeApiHandler, posthogApiHandler);
