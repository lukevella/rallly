import "server-only";
import type { PricesByCurrency } from "@rallly/billing";
import {
  createStripeClient,
  getProPricing,
  pricingData,
} from "@rallly/billing";
import { prisma } from "@rallly/database";
import { cacheLife } from "next/cache";
import { cookies, headers } from "next/headers";
import { CURRENCY_COOKIE_NAME, CURRENCY_HEADER_NAME } from "@/lib/currency";

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

const getStripePricing = async (secretKey: string) => {
  "use cache";
  cacheLife("hours");
  const { currencies } = await getProPricing({
    stripe: createStripeClient({ secretKey }),
  });
  if (Object.keys(currencies).length === 0) {
    throw new Error("Stripe prices carry none of the displayed currencies");
  }
  return currencies;
};

// A failed Stripe call is not cached, so the fallback only lasts for that request.
export const getPricing = async (): Promise<PricesByCurrency> => {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    return fallbackPricing;
  }
  try {
    return await getStripePricing(secretKey);
  } catch (error) {
    console.error("Failed to load prices from Stripe", error);
    return fallbackPricing;
  }
};

// The cookie wins so a visitor's own choice sticks; the header covers the
// first visit, before the proxy's cookie exists. Not cached: it reads the
// request, and the callers stream it under Suspense.
export const getDetectedCurrency = async () => {
  const [cookieStore, headersList] = await Promise.all([cookies(), headers()]);
  return (
    cookieStore.get(CURRENCY_COOKIE_NAME)?.value ??
    headersList.get(CURRENCY_HEADER_NAME) ??
    undefined
  );
};
