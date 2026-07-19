import "server-only";

import { getProPricing } from "@rallly/billing";
import {
  SEAT_UPDATE_PORTAL_HEADLINE,
  SEAT_UPDATE_PORTAL_PURPOSE,
  SEAT_UPDATE_PORTAL_VERSION,
} from "@rallly/billing/lib/portal";
import { absoluteUrl } from "@rallly/utils/absolute-url";
import { getStripe } from "@/features/billing/service";

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

async function createSeatUpdateBillingConfig() {
  const stripe = getStripe();
  const pricing = await getProPricing({ stripe });

  // Both monthly and yearly prices share the same product.
  const monthlyPrice = await stripe.prices.retrieve(pricing.monthly.id);
  const productId = monthlyPrice.product as string;

  return stripe.billingPortal.configurations.create(
    {
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
    },
    {
      // Collapse concurrent first-time creation across processes (e.g. right
      // after a deploy) into a single config. Without this, two cold instances
      // can each create a same-version config — and the cleanup script skips the
      // current version, so the duplicates would linger active forever.
      idempotencyKey: `seat-update-portal-config-v${SEAT_UPDATE_PORTAL_VERSION}`,
    },
  );
}

async function resolveConfigurationId(): Promise<string> {
  // Auto-paginate so a match isn't missed when many stale configs still exist
  // (pre-cleanup). The current-version config is the newest, so this returns on
  // the first page in practice.
  const configs = getStripe().billingPortal.configurations.list({
    active: true,
    limit: 100,
  });
  for await (const config of configs) {
    if (
      config.metadata?.purpose === SEAT_UPDATE_PORTAL_PURPOSE &&
      config.metadata?.version === SEAT_UPDATE_PORTAL_VERSION
    ) {
      return config.id;
    }
  }

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
 */
export async function createStripeSubscriptionUpdateConfirmation({
  customerId,
  subscriptionId,
  subscriptionItemId,
  newSeatCount,
}: {
  customerId: string;
  subscriptionId: string;
  subscriptionItemId: string;
  newSeatCount: number;
}) {
  const configurationId = await getSeatUpdatePortalConfigurationId();

  const portalSession = await getStripe().billingPortal.sessions.create({
    customer: customerId,
    configuration: configurationId,
    return_url: absoluteUrl("/settings/billing"),
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
          return_url: absoluteUrl("/settings/billing", {
            seats_updated: "true",
          }),
        },
      },
    },
  });

  return portalSession.url;
}
