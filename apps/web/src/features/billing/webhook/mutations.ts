import "server-only";

import type { Stripe } from "@rallly/billing";
import { stripe } from "@rallly/billing";
import type { Prisma } from "@rallly/database";
import { prisma } from "@rallly/database";
import { sendRawEmail } from "@rallly/emails";
import { sendLicenseKeyEmail } from "@rallly/emails/templates/license-key";
import * as Sentry from "@sentry/nextjs";
import { after } from "next/server";
import { getInstanceBranding } from "@/emails/branding";
import { env } from "@/env";
import {
  customerMetadataSchema,
  subscriptionMetadataSchema,
} from "@/features/billing/schema";
import {
  getSubscriptionDetails,
  isSubscriptionActive,
  toDate,
} from "@/features/billing/webhook/utils";
import { licenseManager } from "@/features/licensing/mutations";
import { licenseCheckoutMetadataSchema } from "@/features/licensing/schema";
import { posthog } from "@/lib/posthog";

async function getExpandedSubscription(subscriptionId: string) {
  return stripe.subscriptions.retrieve(subscriptionId, {
    expand: ["items.data.price.currency_options"],
  });
}

/**
 * Recomputes a space's tier from its subscriptions so the tier reflects whether
 * *any* subscription is active, rather than the state of a single webhook event.
 * Must run after the triggering subscription's `active` flag has been written in
 * the same transaction. Returns the resolved tier.
 */
async function syncSpaceTier(tx: Prisma.TransactionClient, spaceId: string) {
  const activeSubscription = await tx.subscription.findFirst({
    where: { spaceId, active: true },
    select: { id: true },
  });

  const tier = activeSubscription ? "pro" : "hobby";

  await tx.space.update({
    where: { id: spaceId },
    data: {
      tier,
      ...(tier === "hobby" ? { showBranding: false } : {}),
    },
  });

  return tier;
}

async function createOrUpdatePaymentMethod(
  userId: string,
  paymentMethod: Stripe.PaymentMethod,
) {
  await prisma.paymentMethod.upsert({
    where: {
      id: paymentMethod.id,
    },
    create: {
      id: paymentMethod.id,
      userId,
      type: paymentMethod.type,
      data: paymentMethod[paymentMethod.type] as Prisma.JsonObject,
    },
    update: {
      type: paymentMethod.type,
      data: paymentMethod[paymentMethod.type] as Prisma.JsonObject,
    },
  });
}

async function onCheckoutSessionCompleted(event: Stripe.Event) {
  const checkoutSession = event.data.object as Stripe.Checkout.Session;

  if (checkoutSession.subscription === null) {
    const { success, data } = licenseCheckoutMetadataSchema.safeParse(
      checkoutSession.metadata,
    );

    if (!success) {
      // If there is no metadata than this is likely a donation from a payment link
      console.info("No metadata found for session: ", checkoutSession.id);
      return;
    }

    const { licenseType, version, seats } = data;

    const customerDetails = checkoutSession.customer_details;

    if (!customerDetails) {
      throw new Error(
        `No customer details found for session: ${checkoutSession.id}`,
      );
    }

    const { email } = customerDetails;

    if (!email) {
      throw new Error(
        `No email found for customer details in session: ${checkoutSession.id}`,
      );
    }

    const license = await licenseManager.createLicense({
      type: licenseType,
      licenseeEmail: email,
      licenseeName: customerDetails.name ?? undefined,
      version,
      seats,
      idempotencyKey: checkoutSession.id,
    });

    if (!license || !license.data) {
      throw new Error(
        `Failed to create license for session: ${checkoutSession.id} - ${license?.error}`,
      );
    }

    await sendLicenseKeyEmail({
      to: email,
      from: { name: "Luke from Rallly", address: env.SUPPORT_EMAIL },
      branding: await getInstanceBranding(),
      props: {
        licenseKey: license.data.key,
        seats,
        tier: licenseType,
      },
    });

    posthog()?.capture({
      distinctId: email,
      event: "license_purchase",
      properties: {
        licenseType,
        seats,
        version,
        stripeEventId: event.id,
        $set: {
          tier: licenseType,
        },
      },
    });
  }
}

async function onCheckoutSessionExpired(event: Stripe.Event) {
  const session = event.data.object as Stripe.Checkout.Session;
  // When a Checkout Session expires, the customer's email isn't returned in
  // the webhook payload unless they give consent for promotional content
  const email = session.customer_details?.email;
  const recoveryUrl = session.after_expiration?.recovery?.url;
  const userId = session.metadata?.userId;

  if (!userId) {
    Sentry.captureMessage("No user ID found in Checkout Session metadata");
    return;
  }

  // Do nothing if the Checkout Session has no email or recovery URL
  if (!email || !recoveryUrl) {
    Sentry.captureMessage("No email or recovery URL found in Checkout Session");
    return;
  }

  // TODO (Luke Vella) [2025-08-04]: We may want to send the user an email to users who do not complete checkout
}

async function onCustomerCreated(event: Stripe.Event) {
  const customer = event.data.object as Stripe.Customer;

  const res = customerMetadataSchema.safeParse(customer.metadata);

  if (!res.success) {
    // If there's no userId in metadata, ignore the event
    return;
  }

  const { userId } = res.data;

  // Update the user with the customer id
  await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      customerId: customer.id,
    },
  });
}

async function onCustomerDeleted(event: Stripe.Event) {
  const customer = event.data.object as Stripe.Customer;

  // Find and update the user with this customerId
  await prisma.user.updateMany({
    where: {
      customerId: customer.id,
    },
    data: {
      customerId: null,
    },
  });
}

async function onCustomerSubscriptionCreated(event: Stripe.Event) {
  const subscription = await getExpandedSubscription(
    (event.data.object as Stripe.Subscription).id,
  );

  const isActive = isSubscriptionActive(subscription);
  const { priceId, currency, interval, amount } =
    getSubscriptionDetails(subscription);

  const res = subscriptionMetadataSchema.safeParse(subscription.metadata);

  if (!res.success) {
    throw new Error("Invalid subscription metadata");
  }

  const { userId, spaceId } = res.data;

  const subscriptionItem = subscription.items.data[0];

  if (!subscriptionItem) {
    throw new Error(
      `Missing subscription item in subscription ${subscription.id}`,
    );
  }

  const subscriptionItemId = subscriptionItem.id;
  const quantity = subscriptionItem.quantity ?? 1;

  const tier = await prisma.$transaction(async (tx) => {
    await tx.subscription.upsert({
      where: { id: subscription.id },
      create: {
        id: subscription.id,
        userId,
        active: isActive,
        quantity,
        subscriptionItemId,
        priceId,
        currency,
        interval,
        amount,
        status: subscription.status,
        createdAt: toDate(subscription.created),
        periodStart: toDate(subscription.current_period_start),
        periodEnd: toDate(subscription.current_period_end),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        spaceId,
      },
      update: {
        id: subscription.id,
        userId,
        active: isActive,
        subscriptionItemId,
        quantity,
        priceId,
        currency,
        interval,
        amount,
        status: subscription.status,
        createdAt: toDate(subscription.created),
        periodStart: toDate(subscription.current_period_start),
        periodEnd: toDate(subscription.current_period_end),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        spaceId,
      },
      include: {
        space: true,
      },
    });

    return syncSpaceTier(tx, spaceId);
  });

  posthog()?.groupIdentify({
    groupType: "space",
    groupKey: spaceId,
    properties: {
      seatCount: quantity,
      tier,
    },
  });

  posthog()?.capture({
    distinctId: userId,
    event: "subscription_create",
    properties: {
      interval,
      $set: {
        tier,
      },
    },
    groups: {
      space: spaceId,
    },
  });

  if (isActive) {
    after(async () => {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, name: true },
      });

      if (user) {
        await sendRawEmail({
          to: user.email,
          from: { name: "Luke from Rallly", address: env.SUPPORT_EMAIL },
          subject: "Thanks for subscribing to Rallly Pro",
          text: [
            "Hey there,",
            "Thanks so much for subscribing to Rallly Pro! I really appreciate your support.",
            "I'd love to learn more about how you're using Rallly. What kind of events are you scheduling? Are there any features you wish Rallly had?",
            "Just hit reply and let me know. I read every response and it helps shape what we build next.",
            "Luke\nFounder, Rallly",
          ].join("\n\n"),
        });
      }
    });
  }
}

async function onCustomerSubscriptionDeleted(event: Stripe.Event) {
  const subscription = await stripe.subscriptions.retrieve(
    (event.data.object as Stripe.Subscription).id,
  );

  // void any unpaid invoices
  const invoices = await stripe.invoices.list({
    subscription: subscription.id,
    status: "open",
  });

  for (const invoice of invoices.data) {
    await stripe.invoices.voidInvoice(invoice.id);
  }

  const res = subscriptionMetadataSchema.safeParse(subscription.metadata);

  if (!res.success) {
    throw new Error("Invalid subscription metadata");
  }

  const { userId, spaceId } = res.data;

  const tier = await prisma.$transaction(async (tx) => {
    // updateMany so a missing row (e.g. already cascade-deleted with the user
    // or space) doesn't abort the transaction before the tier sync runs
    await tx.subscription.updateMany({
      where: {
        id: subscription.id,
      },
      data: {
        active: false,
        status: "canceled",
      },
    });

    return syncSpaceTier(tx, spaceId);
  });

  posthog()?.groupIdentify({
    groupType: "space",
    groupKey: spaceId,
    properties: {
      tier,
    },
  });

  posthog()?.capture({
    distinctId: userId,
    event: "subscription_cancel",
    properties: {
      $set: {
        tier,
      },
    },
    groups: {
      space: spaceId,
    },
  });
}

async function onCustomerSubscriptionUpdated(event: Stripe.Event) {
  if (event.type !== "customer.subscription.updated") {
    return;
  }

  const subscription = await getExpandedSubscription(
    (event.data.object as Stripe.Subscription).id,
  );

  const isActive = isSubscriptionActive(subscription);
  const { priceId, currency, interval, amount } =
    getSubscriptionDetails(subscription);

  const res = subscriptionMetadataSchema.safeParse(subscription.metadata);

  if (!res.success) {
    throw new Error("Invalid subscription metadata");
  }

  const { userId, spaceId } = res.data;

  const subscriptionItem = subscription.items.data[0];

  if (!subscriptionItem) {
    throw new Error("Expected subscription to have one item");
  }

  const subscriptionItemId = subscriptionItem.id;
  const quantity = subscriptionItem.quantity ?? 1;

  // Update the subscription in the database
  const tier = await prisma.$transaction(async (tx) => {
    await tx.subscription.upsert({
      where: {
        id: subscription.id,
      },
      update: {
        active: isActive,
        priceId,
        currency,
        interval,
        subscriptionItemId,
        quantity,
        amount,
        status: subscription.status,
        periodStart: toDate(subscription.current_period_start),
        periodEnd: toDate(subscription.current_period_end),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      },
      create: {
        id: subscription.id,
        userId,
        spaceId,
        active: isActive,
        priceId,
        currency,
        interval,
        subscriptionItemId,
        quantity,
        amount,
        status: subscription.status,
        createdAt: toDate(subscription.created),
        periodStart: toDate(subscription.current_period_start),
        periodEnd: toDate(subscription.current_period_end),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      },
    });

    return syncSpaceTier(tx, spaceId);
  });

  posthog()?.groupIdentify({
    groupType: "space",
    groupKey: spaceId,
    properties: {
      seatCount: quantity,
      tier,
    },
  });

  posthog()?.capture({
    distinctId: userId,
    event: "subscription_update",
    properties: {
      interval,
      quantity,
      $set: {
        tier,
      },
    },
    groups: {
      space: spaceId,
    },
  });
}

async function onPaymentMethodAttached(event: Stripe.Event) {
  const paymentMethod = event.data.object as Stripe.PaymentMethod;

  // Only handle payment methods that are attached to a customer
  if (!paymentMethod.customer) {
    return;
  }

  // Find the user associated with this customer
  const user = await prisma.user.findFirst({
    where: {
      customerId: paymentMethod.customer as string,
    },
  });

  if (!user) {
    throw new Error(`No user found for customer ${paymentMethod.customer}`);
  }

  // Upsert the payment method in our database
  await createOrUpdatePaymentMethod(user.id, paymentMethod);
}

async function onPaymentMethodDetached(event: Stripe.Event) {
  const paymentMethod = event.data.object as Stripe.PaymentMethod;

  // deleteMany so repeated detach events don't throw when the record is gone
  await prisma.paymentMethod.deleteMany({
    where: {
      id: paymentMethod.id,
    },
  });
}

async function onPaymentMethodUpdated(event: Stripe.Event) {
  const paymentMethod = event.data.object as Stripe.PaymentMethod;

  if (!paymentMethod.customer) {
    return;
  }

  // Find the user associated with this customer
  const user = await prisma.user.findFirst({
    where: {
      customerId: paymentMethod.customer as string,
    },
  });

  if (!user) {
    throw new Error(`No user found for customer ${paymentMethod.customer}`);
  }

  // Upsert so the event succeeds even if the attach event was missed
  await createOrUpdatePaymentMethod(user.id, paymentMethod);
}

export async function handleStripeWebhookEvent(event: Stripe.Event) {
  switch (event.type) {
    case "checkout.session.completed":
      await onCheckoutSessionCompleted(event);
      break;
    case "checkout.session.expired":
      await onCheckoutSessionExpired(event);
      break;
    case "customer.created":
      await onCustomerCreated(event);
      break;
    case "customer.deleted":
      await onCustomerDeleted(event);
      break;
    case "customer.subscription.created":
      await onCustomerSubscriptionCreated(event);
      break;
    case "customer.subscription.deleted":
      await onCustomerSubscriptionDeleted(event);
      break;
    case "customer.subscription.updated":
      await onCustomerSubscriptionUpdated(event);
      break;
    case "payment_method.attached":
      await onPaymentMethodAttached(event);
      break;
    case "payment_method.detached":
      await onPaymentMethodDetached(event);
      break;
    case "payment_method.automatically_updated":
    case "payment_method.updated":
      await onPaymentMethodUpdated(event);
      break;
    default:
      return { handled: false };
  }

  return { handled: true };
}
