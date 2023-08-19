import { getSession } from "@rallly/backend/next/session";
import { stripe } from "@rallly/backend/stripe";
import { absoluteUrl } from "@rallly/utils";
import { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";

export const config = {
  edge: true,
};

const inputSchema = z.object({
  period: z.enum(["monthly", "yearly"]).optional(),
  success_path: z.string().optional(),
  return_path: z.string().optional(),
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const userSession = await getSession(req, res);

  if (userSession.user?.isGuest !== false) {
    // You need to be logged in to subscribe
    return res
      .status(403)
      .redirect(
        `/login${req.url ? `?redirect=${encodeURIComponent(req.url)}` : ""}`,
      );
  }

  const { period = "monthly", return_path } = inputSchema.parse(req.query);

  const user = await prisma?.user.findUnique({
    where: {
      id: userSession.user.id,
    },
    select: {
      email: true,
      customerId: true,
      subscription: {
        select: {
          active: true,
        },
      },
    },
  });

  if (!user) {
    return res.status(403).redirect("/logout");
  }

  if (user.subscription?.active === true) {
    // User already has an active subscription. Take them to customer portal
    return res.redirect("/api/stripe/portal");
  }

  const session = await stripe.checkout.sessions.create({
    success_url: absoluteUrl(
      return_path ?? "/api/stripe/portal?session_id={CHECKOUT_SESSION_ID}",
    ),
    cancel_url: absoluteUrl(return_path),
    ...(user.customerId
      ? {
          // use existing customer if available to reuse payment details
          customer: user.customerId,
          customer_update: {
            // needed for tax id collection
            name: "auto",
          },
        }
      : {
          // supply email if user is not a customer yet
          customer_email: user.email,
        }),
    mode: "subscription",
    allow_promotion_codes: true,
    billing_address_collection: "auto",
    tax_id_collection: {
      enabled: true,
    },
    metadata: {
      userId: userSession.user.id,
    },
    line_items: [
      {
        price:
          period === "yearly"
            ? "price_1NfKIXHeFNQIbmrtv7s6Wv7U"
            : "price_1NfKF2HeFNQIbmrtaXE0mS8N",
        quantity: 1,
      },
    ],
    automatic_tax: { enabled: true },
  });

  if (session.url) {
    // redirect to checkout session
    return res.status(303).redirect(session.url);
  }

  return res
    .status(500)
    .json({ error: "Something went wrong while creating a checkout session" });
}
