import { stripe } from "@rallly/billing";
import { getSeatUpdatePortalConfigurationId } from "@rallly/billing/lib/portal";
import { absoluteUrl } from "@rallly/utils/absolute-url";

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
  // Reuse the shared seat-update portal configuration (created on first use)
  const configurationId = await getSeatUpdatePortalConfigurationId();

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
