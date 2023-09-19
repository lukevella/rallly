import type { Stripe } from "@rallly/backend/stripe";
import { stripe } from "@rallly/backend/stripe";
import { prisma } from "@rallly/database";
import { buffer } from "micro";
import { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";

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

const metadataSchema = z.object({
  userId: z.string(),
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
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
    case "checkout.session.completed":
      const checkoutSession = event.data.object as Stripe.Checkout.Session;

      if (checkoutSession.subscription === null) {
        // This is a one-time payment (probably for Rallly Self-Hosted)
        break;
      }

      const { userId } = metadataSchema.parse(checkoutSession.metadata);

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
      break;
    case "customer.subscription.deleted":
    case "customer.subscription.updated":
    case "customer.subscription.created":
      const { id } = event.data.object as Stripe.Subscription;

      const subscription = await stripe.subscriptions.retrieve(id);

      // check if the subscription is active
      const isActive = subscription.status === "active";

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
      break;
    default:
      // Unexpected event type
      res.status(400).json({
        error: "Unhandled event type",
      });
  }

  res.end();
}
