"use client";

import { Alert, AlertDescription, AlertTitle } from "@rallly/ui/alert";
import { LockIcon } from "lucide-react";
import type { BillingInterval } from "@/features/billing/schema";
import { Trans, useTranslation } from "@/i18n/client";

function formatPrice({
  amount,
  currency,
  locale,
}: {
  amount: number;
  currency: string;
  locale: string;
}) {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: amount % 100 === 0 ? 0 : 2,
  }).format(amount / 100);
}

export function GrandfatheredPricingBanner({
  amount,
  listAmount,
  currency,
  interval,
  quantity,
}: {
  amount: number;
  listAmount: number;
  currency: string;
  interval: BillingInterval;
  quantity: number;
}) {
  const { i18n } = useTranslation();

  const price = formatPrice({ amount, currency, locale: i18n.language });
  const listPrice = formatPrice({
    amount: listAmount,
    currency,
    locale: i18n.language,
  });

  return (
    <Alert variant="info">
      <LockIcon />
      <AlertTitle>
        <Trans
          i18nKey="grandfatheredPricingBannerTitle"
          defaults="Your price is locked in"
        />
      </AlertTitle>
      <AlertDescription>
        {interval === "month" ? (
          <Trans
            i18nKey="grandfatheredPricingBannerMonthly"
            defaults="{quantity, plural, one {Your price is locked at {price} per month for as long as your subscription stays active. The current price for new subscribers is {listPrice} per month.} other {Your price is locked at {price} per seat per month for as long as your subscription stays active. The current price for new subscribers is {listPrice} per seat per month.}}"
            values={{ quantity, price, listPrice }}
          />
        ) : (
          <Trans
            i18nKey="grandfatheredPricingBannerYearly"
            defaults="{quantity, plural, one {Your price is locked at {price} per year for as long as your subscription stays active. The current price for new subscribers is {listPrice} per year.} other {Your price is locked at {price} per seat per year for as long as your subscription stays active. The current price for new subscribers is {listPrice} per seat per year.}}"
            values={{ quantity, price, listPrice }}
          />
        )}
      </AlertDescription>
    </Alert>
  );
}
