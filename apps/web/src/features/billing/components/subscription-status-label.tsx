"use client";

import type { SubscriptionStatus } from "@rallly/database";
import dayjs from "dayjs";

import { Trans } from "@/components/trans";
import { useTranslation } from "@/i18n/client";

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
        values={{ date: dayjs(periodEnd).format("MMM D YYYY") }}
      />
    );
  }
  return <>{config.label}</>;
};
