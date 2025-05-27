import type { LicenseCheckoutMetadata } from "@/features/licensing/schema";
import type { LicenseType } from "@prisma/client";
import { stripe } from "@rallly/billing";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const productSchema = z.enum(["plus", "organization"]);

type Product = z.infer<typeof productSchema>;

const mapProductToLicenseType: Record<
  Product,
  { type: LicenseType; seats: number; promoCode?: string }
> = {
  plus: { type: "PLUS", seats: 5 },
  organization: { type: "ORGANIZATION", seats: 50, promoCode: "EARLYORG" },
};

export async function GET(request: NextRequest) {
  const product = productSchema.parse(
    request.nextUrl.searchParams.get("product"),
  );
  const prices = await stripe.prices.list({
    lookup_keys: [product],
  });

  if (!prices.data || prices.data.length === 0) {
    // Log this error on your server, as it might indicate a misconfiguration
    console.error(`No price found for lookup_key: ${product}`);
    return NextResponse.json(
      { error: "Pricing information not found for this product." },
      { status: 500 },
    ); // Or 404 if you prefer
  }
  if (prices.data.length > 1) {
    // This might indicate a configuration issue (e.g., duplicate lookup keys)
    console.warn(
      `Multiple prices found for lookup_key: ${product}. Using the first one.`,
    );
  }

  const price = prices.data[0];

  if (!price.id) {
    console.error(`Price object for ${product} is missing an ID.`);
    return NextResponse.json(
      { error: "Price configuration error." },
      { status: 500 },
    );
  }

  const { type, seats, promoCode } = mapProductToLicenseType[product];

  const promotionCodes = await stripe.promotionCodes.list({
    code: promoCode,
    active: true,
  });

  const promoCodeId = promotionCodes.data[0]?.id;

  try {
    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price: price.id,
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: "https://rallly.co/licensing/thank-you",
      ...(promoCodeId ? { discounts: [{ promotion_code: promoCodeId }] } : {}),
      metadata: {
        licenseType: type,
        version: 4,
        seats,
      } satisfies LicenseCheckoutMetadata,
    });

    if (session.url) {
      return NextResponse.redirect(session.url, 303);
    }

    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 },
    );
  } catch (error) {
    console.error("Stripe API error:", error);
    let errorMessage =
      "An unexpected error occurred with our payment processor.";

    if (error instanceof stripe.errors.StripeError) {
      errorMessage = error.message;
    }

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
