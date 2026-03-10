import type { Stripe } from "@rallly/billing";
import { env } from "@/env";
import { posthog } from "@/features/analytics/posthog";
import { licenseCheckoutMetadataSchema } from "@/features/licensing/schema";
import { licenseManager } from "@/features/licensing/server";
import { getEmailClient } from "@/utils/emails";

export async function onCheckoutSessionCompleted(event: Stripe.Event) {
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
    });

    if (!license || !license.data) {
      throw new Error(
        `Failed to create license for session: ${checkoutSession.id} - ${license?.error}`,
      );
    }

    const emailClient = await getEmailClient();

    await emailClient.sendTemplate("LicenseKeyEmail", {
      to: email,
      from: {
        name: "Luke from Rallly",
        address: env.SUPPORT_EMAIL,
      },
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
