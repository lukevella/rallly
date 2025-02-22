import type { Stripe } from "@rallly/billing";
import { prisma } from "@rallly/database";
import * as Sentry from "@sentry/nextjs";
import { kv } from "@vercel/kv";

import { getEmailClient } from "@/utils/emails";

export async function onCheckoutSessionExpired(event: Stripe.Event) {
  const session = event.data.object as Stripe.Checkout.Session;
  // When a Checkout Session expires, the customer's email isn't returned in
  // the webhook payload unless they give consent for promotional content
  const email = session.customer_details?.email;
  const recoveryUrl = session.after_expiration?.recovery?.url;
  const userId = session.metadata?.userId;

  if (!userId) {
    console.info("No user ID found in Checkout Session metadata");
    Sentry.captureMessage("No user ID found in Checkout Session metadata");
    return;
  }

  // Do nothing if the Checkout Session has no email or recovery URL
  if (!email || !recoveryUrl) {
    console.info("No email or recovery URL found in Checkout Session");
    Sentry.captureMessage("No email or recovery URL found in Checkout Session");
    return;
  }

  const promoEmailKey = `promo_email_sent:${email}`;
  // Track that a promotional email opportunity has been shown to this user
  const hasReceivedPromo = await kv.get(promoEmailKey);
  console.info("Has received promo", hasReceivedPromo);

  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      locale: true,
      subscription: {
        select: {
          active: true,
        },
      },
    },
  });

  const isPro = !!user?.subscription?.active;

  // Avoid spamming people who abandon Checkout multiple times
  if (user && !hasReceivedPromo && !isPro) {
    console.info("Sending abandoned checkout email");
    // Set the flag with a 30-day expiration (in seconds)
    await kv.set(promoEmailKey, 1, { ex: 30 * 24 * 60 * 60, nx: true });
    getEmailClient(user.locale ?? undefined).sendTemplate("AbandonedCheckoutEmail", {
      to: email,
      from: {
        name: "Luke from Rallly",
        address: "luke@rallly.co",
      },
      props: {
        name: session.customer_details?.name ?? undefined,
        discount: 20,
        couponCode: "GETPRO1Y20",
        recoveryUrl,
      },
    });
  }
}
