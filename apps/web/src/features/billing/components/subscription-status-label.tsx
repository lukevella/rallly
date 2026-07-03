"use client";

import type { SubscriptionStatus } from "@rallly/database";
import { Trans, useTranslation } from "@/i18n/client";
import { useDateTimeConfig } from "@/lib/datetime/client";
import { formatDateTime } from "@/lib/datetime/format";

interface SubscriptionStatusLabelProps {
  status: SubscriptionStatus;
  cancelAtPeriodEnd: boolean;
  periodEnd: Date;
}

export const SubscriptionStatusLabel = ({
  status,
  cancelAtPeriodEnd,
  periodEnd,
}: SubscriptionStatusLabelProps) => {
  const { t } = useTranslation();
  const { locale, timeZone } = useDateTimeConfig();

  const statusConfig: Record<
    string,
    {
      label: string;
    }
  > = {
    active: {
      label: t("subscriptionStatusActive", { defaultValue: "Active" }),
    },
    paused: {
      label: t("subscriptionStatusPaused", { defaultValue: "Paused" }),
    },
    trialing: {
      label: t("subscriptionStatusTrialing", { defaultValue: "Trialing" }),
    },
    past_due: {
      label: t("subscriptionStatusPastDue", { defaultValue: "Past due" }),
    },
    canceled: {
      label: t("subscriptionStatusCanceled", { defaultValue: "Canceled" }),
    },
    unpaid: {
      label: t("subscriptionStatusUnpaid", { defaultValue: "Unpaid" }),
    },
    incomplete: {
      label: t("subscriptionStatusIncomplete", { defaultValue: "Incomplete" }),
    },
    incomplete_expired: {
      label: t("subscriptionStatusIncompleteExpired", {
        defaultValue: "Incomplete expired",
      }),
    },
    unknown: {
      label: t("subscriptionStatusUnknown", { defaultValue: "Unknown" }),
    },
  };

  const config = statusConfig[status] || statusConfig.unknown;

  if (status === "active" && cancelAtPeriodEnd) {
    return (
      <Trans
        i18nKey="subscriptionCancelOn"
        defaults="Cancels {date}"
        values={{
          date: formatDateTime(periodEnd, {
            preset: "date",
            locale,
            timeZone: timeZone ?? "UTC",
          }),
        }}
      />
    );
  }
  return <>{config.label}</>;
};
