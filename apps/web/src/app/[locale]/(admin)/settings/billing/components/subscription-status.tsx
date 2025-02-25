"use client";

import type { SubscriptionStatus as SubscriptionStatusType } from "@prisma/client";
import dayjs from "dayjs";

import { Trans } from "@/components/trans";
import { useTranslation } from "@/i18n/client";

interface SubscriptionStatusProps {
  status: SubscriptionStatusType;
  cancelAtPeriodEnd: boolean;
  periodEnd: Date;
}

export const SubscriptionStatus = ({
  status,
  cancelAtPeriodEnd,
  periodEnd,
}: SubscriptionStatusProps) => {
  const { t } = useTranslation();

  const statusConfig: Record<
    string,
    {
      label: string;
      variant: "primary" | "default" | "destructive" | "outline" | "green";
    }
  > = {
    active: {
      label: t("subscriptionStatusActive", { defaultValue: "Active" }),
      variant: "green",
    },
    paused: {
      label: t("subscriptionStatusPaused", { defaultValue: "Paused" }),
      variant: "default",
    },
    trialing: {
      label: t("subscriptionStatusTrialing", { defaultValue: "Trialing" }),
      variant: "primary",
    },
    past_due: {
      label: t("subscriptionStatusPastDue", { defaultValue: "Past due" }),
      variant: "destructive",
    },
    canceled: {
      label: t("subscriptionStatusCanceled", { defaultValue: "Canceled" }),
      variant: "default",
    },
    unpaid: {
      label: t("subscriptionStatusUnpaid", { defaultValue: "Unpaid" }),
      variant: "destructive",
    },
    incomplete: {
      label: t("subscriptionStatusIncomplete", { defaultValue: "Incomplete" }),
      variant: "outline",
    },
    incomplete_expired: {
      label: t("subscriptionStatusIncompleteExpired", {
        defaultValue: "Incomplete expired",
      }),
      variant: "outline",
    },
    unknown: {
      label: t("subscriptionStatusUnknown", { defaultValue: "Unknown" }),
      variant: "default",
    },
  };

  const config = statusConfig[status] || statusConfig.unknown;

  if (status === "active" && cancelAtPeriodEnd) {
    return (
      <Trans
        i18nKey="subscriptionCancelOn"
        defaults="Cancels {date}"
        values={{ date: dayjs(periodEnd).format("MMM D") }}
      />
    );
  }
  return <>{config.label}</>;
};
