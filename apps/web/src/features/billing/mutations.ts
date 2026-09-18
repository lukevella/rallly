import "server-only";

import {
  ACCOUNT_PORTAL_CONFIG_VERSION,
  PORTAL_CONFIG_PURPOSE,
  portalConfigPriceKey,
} from "@rallly/billing/lib/portal";
import { prisma } from "@rallly/database";
import { absoluteUrl } from "@rallly/utils/absolute-url";
import { isBillingEnabled } from "@/features/billing/constants";
import type { BillingReturnFlow } from "@/features/billing/schema";
import { getStripe } from "@/features/billing/service";
import { isStripeResourceMissingError } from "@/features/billing/utils";

export async function createStripePortalSession({
  customerId,
  returnPath = "/settings/billing",
}: {
  customerId: string;
  returnPath?: string;
}) {
  const portalSession = await getStripe().billingPortal.sessions.create({
    customer: customerId,
    return_url: absoluteUrl(returnPath),
  });
  return portalSession.url;
}

async function findConfigurationByMetadata(
  match: Record<string, string>,
): Promise<string | undefined> {
  // Auto-paginate so a match isn't missed when many stale configs still exist
  // (pre-cleanup). The live configs are the newest, so this returns on the
  // first page in practice.
  const configs = getStripe().billingPortal.configurations.list({
    active: true,
    limit: 100,
  });
  for await (const config of configs) {
    const metadata = config.metadata ?? {};
    if (
      Object.entries(match).every(([key, value]) => metadata[key] === value)
    ) {
      return config.id;
    }
  }
  return undefined;
}

async function createFlowsConfiguration({ priceIds }: { priceIds: string[] }) {
  const stripe = getStripe();
  const priceKey = portalConfigPriceKey(priceIds);

  // Stripe validates that every price listed under a product belongs to it,
  // so group by product rather than assume the set shares one.
  const pricesByProduct = new Map<string, string[]>();
  for (const priceId of new Set(priceIds)) {
    const price = await stripe.prices.retrieve(priceId);
    const productId = price.product as string;
    pricesByProduct.set(productId, [
      ...(pricesByProduct.get(productId) ?? []),
      priceId,
    ]);
  }

  return stripe.billingPortal.configurations.create(
    {
      business_profile: {
        headline: "Update your subscription",
      },
      features: {
        subscription_update: {
          enabled: true,
          default_allowed_updates: ["price", "quantity"],
          // Invoice prorations immediately so seat additions are charged right
          // away rather than deferred onto the next renewal invoice.
          proration_behavior: "always_invoice",
          products: [...pricesByProduct.entries()].map(([product, prices]) => ({
            product,
            prices,
          })),
        },
        // Cancellation is in-app so the retention moment is ours.
        subscription_cancel: { enabled: false },
        payment_method_update: { enabled: true },
        invoice_history: { enabled: true },
      },
      metadata: {
        purpose: PORTAL_CONFIG_PURPOSE.flows,
        prices: priceKey,
      },
    },
    {
      // Collapse concurrent first-time creation across processes into a
      // single config; the cleanup script would otherwise leave duplicates
      // active forever.
      idempotencyKey: `portal-config-flows-${priceKey}`,
    },
  );
}

async function createAccountConfiguration() {
  return getStripe().billingPortal.configurations.create(
    {
      business_profile: {
        headline: "Manage your billing details",
      },
      features: {
        customer_update: {
          enabled: true,
          allowed_updates: ["name", "address", "tax_id"],
        },
        payment_method_update: { enabled: true },
        invoice_history: { enabled: true },
        // Stripe's create type requires these even when disabled.
        subscription_update: {
          enabled: false,
          default_allowed_updates: null,
          products: null,
        },
        subscription_cancel: { enabled: false },
      },
      metadata: {
        purpose: PORTAL_CONFIG_PURPOSE.account,
        version: ACCOUNT_PORTAL_CONFIG_VERSION,
      },
    },
    {
      idempotencyKey: `portal-config-account-v${ACCOUNT_PORTAL_CONFIG_VERSION}`,
    },
  );
}

// Memoised per server process and per identity. Dedupes concurrent callers
// and survives across warm invocations; resets on failure so the next call
// retries.
const configurationIdPromises = new Map<string, Promise<string>>();

function memoiseConfigurationId(key: string, resolve: () => Promise<string>) {
  let promise = configurationIdPromises.get(key);
  if (!promise) {
    promise = resolve().catch((error) => {
      configurationIdPromises.delete(key);
      throw error;
    });
    configurationIdPromises.set(key, promise);
  }
  return promise;
}

export function getFlowsPortalConfigurationId({
  priceIds,
}: {
  priceIds: string[];
}) {
  const priceKey = portalConfigPriceKey(priceIds);
  return memoiseConfigurationId(`flows:${priceKey}`, async () => {
    const existing = await findConfigurationByMetadata({
      purpose: PORTAL_CONFIG_PURPOSE.flows,
      prices: priceKey,
    });
    if (existing) {
      return existing;
    }
    return (await createFlowsConfiguration({ priceIds })).id;
  });
}

export function getAccountPortalConfigurationId() {
  return memoiseConfigurationId(
    `account:${ACCOUNT_PORTAL_CONFIG_VERSION}`,
    async () => {
      const existing = await findConfigurationByMetadata({
        purpose: PORTAL_CONFIG_PURPOSE.account,
        version: ACCOUNT_PORTAL_CONFIG_VERSION,
      });
      if (existing) {
        return existing;
      }
      return (await createAccountConfiguration()).id;
    },
  );
}

export function billingReturnUrl(flow: BillingReturnFlow) {
  return absoluteUrl("/api/stripe/return", { flow });
}

/**
 * Creates a billing portal session deep-linked to the confirmation screen for
 * a specific change to the subscription's single item: a new quantity, a new
 * price, or both. The configuration only lists the subscriber's own price
 * set, so an early supporter can never be moved onto a current price here.
 * The subscriber's own current price is always included even when it's
 * neither the current nor early supporter price (a legacy tail price):
 * Stripe's subscription_update_confirm requires the item's current price to
 * be in the configuration's product price list, or the flow fails outright.
 */
export async function createStripeSubscriptionUpdateConfirmation({
  customerId,
  subscriptionId,
  subscriptionItemId,
  priceIds,
  item,
  returnFlow,
}: {
  customerId: string;
  subscriptionId: string;
  subscriptionItemId: string;
  priceIds: string[];
  item: { quantity?: number; price?: string };
  returnFlow: BillingReturnFlow;
}) {
  const configurationId = await getFlowsPortalConfigurationId({ priceIds });

  const portalSession = await getStripe().billingPortal.sessions.create({
    customer: customerId,
    configuration: configurationId,
    return_url: absoluteUrl("/settings/billing"),
    flow_data: {
      type: "subscription_update_confirm",
      subscription_update_confirm: {
        subscription: subscriptionId,
        items: [{ id: subscriptionItemId, ...item }],
      },
      after_completion: {
        type: "redirect",
        redirect: { return_url: billingReturnUrl(returnFlow) },
      },
    },
  });

  return portalSession.url;
}

/**
 * Stripe's cancellation screen (reasons, period end confirmation) as a deep
 * link. Uses the account's default portal configuration, the one that has
 * cancellation enabled; the code defined configurations disable it.
 */
export async function createStripeCancelSession({
  customerId,
  subscriptionId,
}: {
  customerId: string;
  subscriptionId: string;
}) {
  const session = await getStripe().billingPortal.sessions.create({
    customer: customerId,
    return_url: absoluteUrl("/settings/billing"),
    flow_data: {
      type: "subscription_cancel",
      subscription_cancel: { subscription: subscriptionId },
      after_completion: {
        type: "redirect",
        redirect: { return_url: billingReturnUrl("cancel") },
      },
    },
  });
  return session.url;
}

/**
 * The account portal: invoices, payment methods, billing address and tax id.
 * Its configuration disables every subscription control, so the plan can only
 * be changed from our own card.
 */
export async function createAccountPortalSession({
  customerId,
}: {
  customerId: string;
}) {
  const session = await getStripe().billingPortal.sessions.create({
    customer: customerId,
    configuration: await getAccountPortalConfigurationId(),
    return_url: absoluteUrl("/settings/billing"),
  });
  return session.url;
}

export async function createPaymentMethodUpdateSession({
  customerId,
}: {
  customerId: string;
}) {
  const session = await getStripe().billingPortal.sessions.create({
    customer: customerId,
    configuration: await getAccountPortalConfigurationId(),
    return_url: absoluteUrl("/settings/billing"),
    flow_data: {
      type: "payment_method_update",
      after_completion: {
        type: "redirect",
        redirect: { return_url: billingReturnUrl("payment_method") },
      },
    },
  });
  return session.url;
}

// Stripe is the source of truth and the webhook writes the same value, but
// the page re-renders as soon as the action returns, so the row is updated
// here too rather than showing "Ends" for a few seconds after resuming.
export async function resumeSubscriptionRenewal({
  subscriptionId,
}: {
  subscriptionId: string;
}) {
  await getStripe().subscriptions.update(subscriptionId, {
    cancel_at_period_end: false,
  });
  await prisma.subscription.update({
    where: { id: subscriptionId },
    data: { cancelAtPeriodEnd: false },
  });
}

// Scheduling an account deletion must guarantee no further charges without
// destroying anything: cancel_at_period_end stops the renewal while keeping
// the paid-for time, and is reversible if the deletion is cancelled.
// Database state syncs via the customer.subscription.updated webhook.
async function setUserSubscriptionRenewals({
  userId,
  cancelAtPeriodEnd,
}: {
  userId: string;
  cancelAtPeriodEnd: boolean;
}) {
  if (!isBillingEnabled) {
    return 0;
  }

  const subscriptions = await prisma.subscription.findMany({
    where: { userId, active: true },
    select: { id: true },
  });

  if (subscriptions.length === 0) {
    return 0;
  }

  const stripe = getStripe();

  for (const subscription of subscriptions) {
    try {
      await stripe.subscriptions.update(subscription.id, {
        cancel_at_period_end: cancelAtPeriodEnd,
      });
    } catch (error) {
      if (!isStripeResourceMissingError(error)) {
        throw error;
      }
    }
  }

  return subscriptions.length;
}

export async function stopUserSubscriptionRenewals({
  userId,
}: {
  userId: string;
}) {
  return setUserSubscriptionRenewals({ userId, cancelAtPeriodEnd: true });
}

export async function resumeUserSubscriptionRenewals({
  userId,
}: {
  userId: string;
}) {
  return setUserSubscriptionRenewals({ userId, cancelAtPeriodEnd: false });
}

// Database state (subscription row, space tier) is synced by the
// customer.subscription.deleted webhook, the same path portal
// cancellations take.
export async function cancelUserSubscriptions({ userId }: { userId: string }) {
  if (!isBillingEnabled) {
    return;
  }

  const subscriptions = await prisma.subscription.findMany({
    where: { userId, active: true },
    select: { id: true },
  });

  if (subscriptions.length === 0) {
    return;
  }

  const stripe = getStripe();

  for (const subscription of subscriptions) {
    try {
      await stripe.subscriptions.cancel(subscription.id);
    } catch (error) {
      if (!isStripeResourceMissingError(error)) {
        throw error;
      }
    }
  }
}

export async function deleteStripeCustomer({
  customerId,
}: {
  customerId: string;
}) {
  if (!isBillingEnabled) {
    return;
  }

  try {
    await getStripe().customers.del(customerId);
  } catch (error) {
    if (!isStripeResourceMissingError(error)) {
      throw error;
    }
  }
}
