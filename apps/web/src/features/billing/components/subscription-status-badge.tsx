"use client";

import { Badge } from "@rallly/ui/badge";
import { DotIcon } from "lucide-react";
import type { SubscriptionStatus } from "@/features/billing/schema";
import { Trans } from "@/i18n/client";

export function SubscriptionStatusBadge({
  status,
}: {
  status: SubscriptionStatus;
}) {
  switch (status) {
    case "active":
      return (
        <Badge variant="green" className="gap-0.5">
          <DotIcon className="-mx-1 size-4" />
          <Trans i18nKey="subscriptionStatusActive" defaults="Active" />
        </Badge>
      );
    case "trialing":
      return (
        <Badge variant="secondary">
          <Trans i18nKey="subscriptionStatusTrialing" defaults="Trialing" />
        </Badge>
      );
    case "paused":
      return (
        <Badge>
          <Trans i18nKey="subscriptionStatusPaused" defaults="Paused" />
        </Badge>
      );
    case "past_due":
      return (
        <Badge variant="amber">
          <Trans i18nKey="subscriptionStatusPastDue" defaults="Past due" />
        </Badge>
      );
    case "unpaid":
      return (
        <Badge variant="destructive">
          <Trans i18nKey="subscriptionStatusUnpaid" defaults="Unpaid" />
        </Badge>
      );
    case "canceled":
      return (
        <Badge>
          <Trans i18nKey="subscriptionStatusCanceled" defaults="Canceled" />
        </Badge>
      );
    case "incomplete":
      return (
        <Badge>
          <Trans i18nKey="subscriptionStatusIncomplete" defaults="Incomplete" />
        </Badge>
      );
    case "incomplete_expired":
      return (
        <Badge>
          <Trans
            i18nKey="subscriptionStatusIncompleteExpired"
            defaults="Incomplete expired"
          />
        </Badge>
      );
  }
}
