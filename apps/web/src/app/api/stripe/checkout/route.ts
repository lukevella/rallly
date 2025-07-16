import { getProPricing, stripe } from "@rallly/billing";
import { prisma } from "@rallly/database";
import { absoluteUrl } from "@rallly/utils/absolute-url";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/data/user";
import type {
  SubscriptionCheckoutMetadata,
  SubscriptionMetadata,
} from "@/features/subscription/schema";

const inputSchema = z.object({
  period: z.enum(["monthly", "yearly"]).optional(),
  success_path: z.string().optional(),
  return_path: z.string().optional(),
});

export async function POST(request: NextRequest) {
  const { user } = await requireUser();

  const formData = await request.formData();
  const data = inputSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!data.success) {
    return NextResponse.json(data.error, { status: 400 });
  }

  const { period, return_path } = data.data;

  let customerId: string;

  const res = await prisma.user.findUniqueOrThrow({
    where: {
      id: user.id,
    },
    select: {
      customerId: true,
    },
  });

  if (res.customerId) {
    customerId = res.customerId;
  } else {
    // create a new customer in stripe
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.name,
    });

    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        customerId: customer.id,
      },
    });

    customerId = customer.id;
  }

  if (user.isPro) {
    // User already has an active subscription. Take them to customer portal
    return NextResponse.redirect(
      new URL("/api/stripe/portal", request.url),
      303,
    );
  }

  const proPricingData = await getProPricing();

  let spaceId = user.activeSpaceId;

  if (!spaceId) {
    const space = await prisma.space.findFirstOrThrow({
      where: {
        ownerId: user.id,
      },
      select: {
        id: true,
      },
    });

    spaceId = space.id;
  }

  const checkoutSession = await stripe.checkout.sessions.create({
    success_url: absoluteUrl(
      return_path ?? "/api/stripe/portal?session_id={CHECKOUT_SESSION_ID}",
    ),
    cancel_url: absoluteUrl(return_path),
    customer: customerId,
    customer_update: {
      name: "auto",
      address: "auto",
    },
    mode: "subscription",
    allow_promotion_codes: true,
    billing_address_collection: "auto",
    tax_id_collection: {
      enabled: true,
    },
    metadata: {
      userId: user.id,
      spaceId,
    } satisfies SubscriptionCheckoutMetadata,
    subscription_data: {
      metadata: {
        userId: user.id,
        spaceId,
      } satisfies SubscriptionMetadata,
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
    expires_at: Math.floor(Date.now() / 1000) + 30 * 60, // 30 minutes
    after_expiration: {
      recovery: {
        enabled: true,
        allow_promotion_codes: true,
      },
    },
  });

  if (checkoutSession.url) {
    // redirect to checkout session
    return NextResponse.redirect(checkoutSession.url, 303);
  }

  return NextResponse.json(
    { error: "Something went wrong while creating a checkout session" },
    { status: 500 },
  );
}
