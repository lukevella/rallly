import { getProPricing, stripe } from "@rallly/billing";
import { absoluteUrl } from "@rallly/utils/absolute-url";
import { AppError } from "@/lib/errors";

async function createQuantityUpdatePortalConfiguration(): Promise<string> {
  try {
    // Get pricing data to configure allowed products and prices
    const pricingData = await getProPricing();

    // Get the product ID from one of the prices (both monthly and yearly should have the same product)
    const monthlyPrice = await stripe.prices.retrieve(pricingData.monthly.id);
    const productId = monthlyPrice.product as string;

    // Create a billing portal configuration that allows both price and quantity changes
    const configuration = await stripe.billingPortal.configurations.create({
      business_profile: {
        headline: "Update your seat allocation",
      },
      features: {
        subscription_update: {
          enabled: true,
          default_allowed_updates: ["price", "quantity"], // Allow both price and quantity changes
          proration_behavior: "create_prorations",
          products: [
            {
              product: productId,
              prices: [pricingData.monthly.id, pricingData.yearly.id], // Allow switching between monthly and yearly
            },
          ],
        },
        subscription_cancel: {
          enabled: false, // Disable cancellation in seat management flow
        },
        payment_method_update: {
          enabled: true,
        },
        invoice_history: {
          enabled: true,
        },
      },
    });

    return configuration.id;
  } catch (error) {
    throw new AppError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Failed to create billing portal configuration",
      cause: error,
    });
  }
}

export const createStripeSubscriptionUpdateConfirmation = async ({
  customerId,
  subscriptionId,
  subscriptionItemId,
  newSeatCount,
}: {
  customerId: string;
  subscriptionId: string;
  subscriptionItemId: string;
  newSeatCount: number;
}) => {
  // Create a billing portal configuration that allows quantity updates
  const configurationId = await createQuantityUpdatePortalConfiguration();

  // Create Stripe billing portal session with subscription_update_confirm flow
  // This deep links directly to the confirmation screen for the specific quantity change
  const portalSession = await stripe.billingPortal.sessions.create({
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
          return_url: absoluteUrl("/settings/billing?seats_updated=true"),
        },
      },
    },
  });

  return portalSession.url;
};
