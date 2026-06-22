import { getProPricing, stripe } from "./stripe";

/**
 * Shared definition for the billing portal configuration used by the seat-update
 * flow. Both the seat-update flow (createStripeSubscriptionUpdateConfirmation,
 * below) and the cleanup script (scripts/cleanup-portal-configurations.ts) depend
 * on these markers.
 *
 * The configuration is created lazily and reused — `getSeatUpdatePortalConfigurationId`
 * finds the existing configuration for the current VERSION (or creates one) instead
 * of creating a fresh configuration on every portal session.
 *
 * Bump SEAT_UPDATE_PORTAL_VERSION whenever the configuration shape below changes.
 * A new configuration is then created on next use, and the cleanup script will
 * deactivate the now-stale previous-version configurations.
 */
export const SEAT_UPDATE_PORTAL_HEADLINE = "Update your seat allocation";
export const SEAT_UPDATE_PORTAL_PURPOSE = "seat_update";
export const SEAT_UPDATE_PORTAL_VERSION = "1";

async function createSeatUpdateBillingConfig() {
  const pricing = await getProPricing();

  // Both monthly and yearly prices share the same product.
  const monthlyPrice = await stripe.prices.retrieve(pricing.monthly.id);
  const productId = monthlyPrice.product as string;

  return stripe.billingPortal.configurations.create({
    business_profile: {
      headline: SEAT_UPDATE_PORTAL_HEADLINE,
    },
    features: {
      subscription_update: {
        enabled: true,
        default_allowed_updates: ["price", "quantity"],
        // Invoice prorations immediately so seat additions are charged right away
        // rather than deferred onto the next renewal invoice.
        proration_behavior: "always_invoice",
        products: [
          {
            product: productId,
            prices: [pricing.monthly.id, pricing.yearly.id],
          },
        ],
      },
      subscription_cancel: {
        enabled: false,
      },
      payment_method_update: {
        enabled: true,
      },
      invoice_history: {
        enabled: true,
      },
    },
    metadata: {
      purpose: SEAT_UPDATE_PORTAL_PURPOSE,
      version: SEAT_UPDATE_PORTAL_VERSION,
    },
  });
}

async function resolveConfigurationId(): Promise<string> {
  const existing = await stripe.billingPortal.configurations.list({
    active: true,
    limit: 100,
  });

  const match = existing.data.find(
    (config) =>
      config.metadata?.purpose === SEAT_UPDATE_PORTAL_PURPOSE &&
      config.metadata?.version === SEAT_UPDATE_PORTAL_VERSION,
  );
  if (match) return match.id;

  const created = await createSeatUpdateBillingConfig();
  return created.id;
}

// Memoised per server process. Dedupes concurrent callers and survives across
// warm invocations; resets on failure so the next call retries.
let configurationIdPromise: Promise<string> | undefined;

function getSeatUpdatePortalConfigurationId(): Promise<string> {
  if (!configurationIdPromise) {
    configurationIdPromise = resolveConfigurationId().catch((error) => {
      configurationIdPromise = undefined;
      throw error;
    });
  }
  return configurationIdPromise;
}

/**
 * Creates a billing portal session deep-linked to the seat-update confirmation
 * screen for a specific quantity change, reusing the shared configuration.
 *
 * `returnUrl`/`successUrl` are passed in by the caller so this package stays
 * free of app routing concerns.
 */
export async function createStripeSubscriptionUpdateConfirmation({
  customerId,
  subscriptionId,
  subscriptionItemId,
  newSeatCount,
  returnUrl,
  successUrl,
}: {
  customerId: string;
  subscriptionId: string;
  subscriptionItemId: string;
  newSeatCount: number;
  returnUrl: string;
  successUrl: string;
}) {
  const configurationId = await getSeatUpdatePortalConfigurationId();

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: customerId,
    configuration: configurationId,
    return_url: returnUrl,
    flow_data: {
      type: "subscription_update_confirm",
      subscription_update_confirm: {
        subscription: subscriptionId,
        items: [
          {
            id: subscriptionItemId,
            quantity: newSeatCount,
          },
        ],
      },
      after_completion: {
        type: "redirect",
        redirect: {
          return_url: successUrl,
        },
      },
    },
  });

  return portalSession.url;
}
