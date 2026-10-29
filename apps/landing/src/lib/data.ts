import "server-only";
import type { PricesByCurrency } from "@rallly/billing";
import {
  createStripeClient,
  getProPricing,
  pricingData,
} from "@rallly/billing";
import { prisma } from "@rallly/database";
import { cacheLife } from "next/cache";

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export const getMonthlyPollCount = async () => {
  "use cache";
  cacheLife("days");
  return prisma.poll.count({
    where: {
      deleted: false,
      participants: {
        some: {
          createdAt: { gte: new Date(Date.now() - THIRTY_DAYS_MS) },
        },
      },
    },
  });
};

export const getMonthlyVoterCount = async () => {
  "use cache";
  cacheLife("days");
  return prisma.participant.count({
    where: {
      createdAt: { gte: new Date(Date.now() - THIRTY_DAYS_MS) },
    },
  });
};

const fallbackPricing: PricesByCurrency = {
  [pricingData.monthly.currency]: {
    monthly: pricingData.monthly.amount,
    yearly: pricingData.yearly.amount,
  },
};

// Errors are caught inside the cache scope: an error thrown out of "use cache"
// fails the prerender even when the caller catches it. A failure keeps the
// fallback for minutes rather than hours, so Stripe is retried soon.
const getStripePricing = async (secretKey: string) => {
  "use cache";
  try {
    const { currencies } = await getProPricing({
      stripe: createStripeClient({ secretKey }),
    });
    if (Object.keys(currencies).length === 0) {
      throw new Error("Stripe prices carry none of the displayed currencies");
    }
    cacheLife("hours");
    return currencies;
  } catch (error) {
    console.error("Failed to load prices from Stripe", error);
    cacheLife("minutes");
    return fallbackPricing;
  }
};

export const getPricing = async (): Promise<PricesByCurrency> => {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    console.warn(
      "STRIPE_SECRET_KEY is not set; the pricing page shows the built in USD prices",
    );
    return fallbackPricing;
  }
  return getStripePricing(secretKey);
};
