import { licensingClient } from "@/features/licensing/client";
import { getSeats } from "@/features/licensing/helpers/get-seats";
import { licenseCheckoutMetadataSchema } from "@/features/licensing/schema";
import { subscriptionCheckoutMetadataSchema } from "@/features/subscription/schema";
import { getEmailClient } from "@/utils/emails";
import type { Stripe } from "@rallly/billing";
import { stripe } from "@rallly/billing";
import { posthog } from "@rallly/posthog/server";

async function handleSubscriptionCheckoutSessionCompleted(
  checkoutSession: Stripe.Checkout.Session,
) {
  const { userId } = subscriptionCheckoutMetadataSchema.parse(
    checkoutSession.metadata,
  );

  const subscription = await stripe.subscriptions.retrieve(
    checkoutSession.subscription as string,
  );

  posthog?.capture({
    distinctId: userId,
    event: "upgrade",
    properties: {
      interval: subscription.items.data[0].price.recurring?.interval,
      $set: {
        tier: "pro",
      },
    },
  });
}

async function handleSelfHostedCheckoutSessionCompleted(
  checkoutSession: Stripe.Checkout.Session,
) {
  const { success, data } = licenseCheckoutMetadataSchema.safeParse(
    checkoutSession.metadata,
  );

  if (!success) {
    // If there is no metadata than this is likely a donation from a payment link
    console.info("No metadata found for session: ", checkoutSession.id);
    return;
  }

  const { licenseType } = data;

  const seats = getSeats(licenseType);

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

  const license = await licensingClient.createLicense({
    type: licenseType,
    licenseeEmail: email,
    licenseeName: customerDetails.name ?? undefined,
    seats,
    stripeCustomerId: checkoutSession.customer as string,
  });

  if (!license || !license.data) {
    throw new Error(
      `Failed to create team license for session: ${checkoutSession.id} - ${license?.error}`,
    );
  }

  const emailClient = getEmailClient();

  emailClient.sendTemplate("LicenseKeyEmail", {
    to: email,
    from: {
      name: "Luke from Rallly",
      address: process.env.SUPPORT_EMAIL,
    },
    props: {
      licenseKey: license.data.key,
      seats,
      tier: licenseType,
    },
  });
}

export async function onCheckoutSessionCompleted(event: Stripe.Event) {
  const checkoutSession = event.data.object as Stripe.Checkout.Session;

  if (checkoutSession.subscription === null) {
    await handleSelfHostedCheckoutSessionCompleted(checkoutSession);
  } else {
    await handleSubscriptionCheckoutSessionCompleted(checkoutSession);
  }
}
