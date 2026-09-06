export const pricingData = {
  monthly: {
    amount: 700,
    currency: "usd",
  },
  yearly: {
    amount: 5600,
    currency: "usd",
  },
};

export function yearlySavingsPercent({
  monthly,
  yearly,
}: {
  monthly: number;
  yearly: number;
}) {
  return Math.round((1 - yearly / (monthly * 12)) * 100);
}

export const displayedCurrencies = ["usd", "eur", "gbp"] as const;

export type DisplayedCurrency = (typeof displayedCurrencies)[number];

export function isDisplayedCurrency(value: string): value is DisplayedCurrency {
  return (displayedCurrencies as readonly string[]).includes(value);
}
