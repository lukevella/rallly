import type { Stripe } from "@rallly/billing";
import * as Sentry from "@sentry/nextjs";

export async function onCheckoutSessionExpired(event: Stripe.Event) {
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
