"use client";

import { CircleCheckIcon, CircleXIcon } from "lucide-react";
import { Trans } from "@/i18n/client";
import { useDateTime } from "@/lib/datetime/client";

/**
 * Outcome of the webhook's last attempted delivery. An icon and its own
 * words carry the state; the color only reinforces it.
 */
export function WebhookLastDelivery({
  delivery,
}: {
  delivery?: {
    status: "succeeded" | "failed" | "exhausted" | "pending" | "in_flight";
    lastResponseStatus: number | null;
    updatedAt: Date;
  };
}) {
  const { toRelativeTime } = useDateTime();

  if (!delivery) {
    return (
      <div className="text-muted-foreground text-sm">
        <Trans i18nKey="noDeliveriesYet" defaults="No deliveries yet" />
      </div>
    );
  }

  const when = toRelativeTime(delivery.updatedAt);

  if (delivery.status === "succeeded") {
    return (
      <div className="flex items-center gap-1.5 text-muted-foreground text-sm">
        <CircleCheckIcon className="size-4 shrink-0 text-green-600" />
        <Trans
          i18nKey="webhookLastDeliverySucceeded"
          defaults="Delivered {date}"
          values={{ date: when }}
        />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 text-muted-foreground text-sm">
      <CircleXIcon className="size-4 shrink-0 text-destructive" />
      {delivery.lastResponseStatus ? (
        <Trans
          i18nKey="webhookLastDeliveryFailedWithStatus"
          defaults="Failed {date} with {status}"
          values={{ date: when, status: delivery.lastResponseStatus }}
        />
      ) : (
        <Trans
          i18nKey="webhookLastDeliveryFailed"
          defaults="Failed {date}"
          values={{ date: when }}
        />
      )}
    </div>
  );
}
