"use client";

import { Trans } from "@/components/trans";

/**
 * Returns the formatted price for the given amount, interval and currency.
 * eg. $7 per month, £40 per year, etc…
 */
export function SubscriptionPrice({
  amount,
  interval,
  currency,
}: {
  amount: number;
  interval: string;
  currency: string;
}) {
  const formattedAmount = new Intl.NumberFormat("en", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 2,
  }).format(amount / 100); // Divide by 100 since amount is in cents

  return (
    <span>
      {interval === "month" ? (
        <Trans
          i18nKey="subscriptionPriceMonthly"
          defaults="{{price}} per month"
          values={{ price: formattedAmount }}
        />
      ) : (
        <Trans
          i18nKey="subscriptionPriceYearly"
          defaults="{{price}} per year"
          values={{ price: formattedAmount }}
        />
      )}
    </span>
  );
}
