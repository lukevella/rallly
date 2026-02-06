import { stripe } from "@rallly/billing";
import type { LicenseType } from "@rallly/database";
import { createLogger } from "@rallly/logger";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import * as z from "zod";
import type { LicenseCheckoutMetadata } from "@/features/licensing/schema";

const logger = createLogger("api/stripe/buy-license");

const productSchema = z.enum(["plus", "organization"]);

type Product = z.infer<typeof productSchema>;

const mapProductToLicenseType: Record<
  Product,
  { lookupKey: string; type: LicenseType; seats: number }
> = {
  plus: { lookupKey: "plus", type: "PLUS", seats: 5 },
  organization: {
    lookupKey: "early-organization",
    type: "ORGANIZATION",
    seats: 50,
  },
};

export async function GET(request: NextRequest) {
  const product = productSchema.parse(
    request.nextUrl.searchParams.get("product"),
  );

  const { lookupKey } = mapProductToLicenseType[product];

  const prices = await stripe.prices.list({
    lookup_keys: [lookupKey],
  });

  if (!prices.data || prices.data.length === 0) {
    logger.error({ product }, "No price found for lookup_key");
    return NextResponse.json(
      { error: "Pricing information not found for this product." },
      { status: 500 },
    ); // Or 404 if you prefer
  }
  if (prices.data.length > 1) {
    logger.warn(
      { product },
      "Multiple prices found for lookup_key, using the first one",
    );
  }

  const price = prices.data[0];

  if (!price.id) {
    logger.error({ product }, "Price object is missing an ID");
    return NextResponse.json(
      { error: "Price configuration error." },
      { status: 500 },
    );
  }

  const { type, seats } = mapProductToLicenseType[product];

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
      allow_promotion_codes: true,
      tax_id_collection: {
        enabled: true,
      },
      automatic_tax: {
        enabled: true,
      },
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
    logger.error({ error }, "Stripe API error");
    let errorMessage =
      "An unexpected error occurred with our payment processor.";

    if (error instanceof stripe.errors.StripeError) {
      errorMessage = error.message;
    }

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
