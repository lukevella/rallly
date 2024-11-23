import { getProPricing, stripe } from "@rallly/billing";
import { prisma } from "@rallly/database";
import { absoluteUrl } from "@rallly/utils/absolute-url";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";

import { getServerSession } from "@/auth";

const inputSchema = z.object({
  period: z.enum(["monthly", "yearly"]).optional(),
  success_path: z.string().optional(),
  return_path: z.string().optional(),
});

export async function POST(request: NextRequest) {
  const userSession = await getServerSession();
  const formData = await request.formData();
  const { period = "monthly", return_path } = inputSchema.parse(
    Object.fromEntries(formData.entries()),
  );

  if (!userSession || userSession.user.email === null) {
    // You need to be logged in to subscribe
    return NextResponse.redirect(
      new URL(
        `/login${
          return_path ? `?redirect=${encodeURIComponent(return_path)}` : ""
        }`,
        request.url,
      ),
      303,
    );
  }

  const user = await prisma.user.findUnique({
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
    return new NextResponse(null, { status: 404 });
  }

  if (user.subscription?.active === true) {
    // User already has an active subscription. Take them to customer portal
    return NextResponse.redirect(
      new URL("/api/stripe/portal", request.url),
      303,
    );
  }

  const proPricingData = await getProPricing();

  const session = await stripe.checkout.sessions.create({
    success_url: absoluteUrl(
      return_path ?? "/api/stripe/portal?session_id={CHECKOUT_SESSION_ID}",
    ),
    cancel_url: absoluteUrl(return_path),
    ...(user.customerId
      ? {
          customer: user.customerId,
          customer_update: {
            name: "auto",
          },
        }
      : {
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
    subscription_data: {
      metadata: {
        userId: userSession.user.id,
      },
    },
    line_items: [
      {
        price:
          period === "yearly"
            ? proPricingData.yearly.id
            : proPricingData.monthly.id,
        quantity: 1,
      },
    ],
    automatic_tax: {
      enabled: true,
    },
  });

  if (session.url) {
    // redirect to checkout session
    return NextResponse.redirect(session.url, 303);
  }

  return NextResponse.json(
    { error: "Something went wrong while creating a checkout session" },
    { status: 500 },
  );
}
