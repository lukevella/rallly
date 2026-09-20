"use client";

import { Trans } from "@/i18n/client";
import type { WebhookEventType } from "../schema";

/**
 * A switch rather than a lookup keyed by event type: i18n keys must be
 * literals so the scanner can find them.
 */
export function WebhookEventLabel({
  eventType,
}: {
  eventType: WebhookEventType;
}) {
  switch (eventType) {
    case "poll.closed":
      return (
        <Trans
          i18nKey="webhookEventPollClosed"
          defaults="A poll stopped accepting responses"
        />
      );
    case "poll.reopened":
      return (
        <Trans
          i18nKey="webhookEventPollReopened"
          defaults="A closed poll started accepting responses again"
        />
      );
    case "poll.scheduled":
      return (
        <Trans
          i18nKey="webhookEventPollScheduled"
          defaults="A poll was booked on one of its options"
        />
      );
  }
}
