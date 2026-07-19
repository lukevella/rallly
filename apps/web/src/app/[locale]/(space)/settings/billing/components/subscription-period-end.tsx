"use client";

import type { SubscriptionStatus } from "@/features/billing/schema";
import { Trans } from "@/i18n/client";
import { useDateTime } from "@/lib/datetime/client";

export function SubscriptionPeriodEnd({
  status,
  cancelAtPeriodEnd,
  periodEnd,
}: {
  status: SubscriptionStatus;
  cancelAtPeriodEnd: boolean;
  periodEnd: Date;
}) {
  const { formatDateTime } = useDateTime();
  const date = formatDateTime(periodEnd, "date");

  if (status === "canceled" || cancelAtPeriodEnd) {
    return (
      <Trans
        i18nKey="subscriptionCardEndsOn"
        defaults="Ends {date}"
        values={{ date }}
      />
    );
  }

  return (
    <Trans
      i18nKey="subscriptionCardRenewsOn"
      defaults="Renews {date}"
      values={{ date }}
    />
  );
}
