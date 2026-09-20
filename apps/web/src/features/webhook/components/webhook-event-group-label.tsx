"use client";

import { Trans } from "@/i18n/client";
import type { WebhookEventResource } from "../utils";

/**
 * A switch rather than a lookup keyed by resource: i18n keys must be
 * literals so the scanner can find them.
 */
export function WebhookEventGroupLabel({
  resource,
}: {
  resource: WebhookEventResource;
}) {
  switch (resource) {
    case "poll":
      return <Trans i18nKey="poll" defaults="Poll" />;
  }
}
