import { absoluteUrl } from "@rallly/utils/absolute-url";

import { stripe } from "./lib/stripe";

export type PortalInput = {
  sessionId?: string;
  returnPath?: string;
  customerId?: string;
};

export async function createPortalSession({
  sessionId,
  returnPath,
  customerId,
}: PortalInput) {
  let stripeCustomerId: string;

  if (sessionId) {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    stripeCustomerId = session.customer as string;
  } else if (customerId) {
    stripeCustomerId = customerId;
  } else {
    throw new Error("Either sessionId or customerId must be provided");
  }

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: stripeCustomerId,
    return_url: absoluteUrl(returnPath),
  });

  return portalSession;
}
