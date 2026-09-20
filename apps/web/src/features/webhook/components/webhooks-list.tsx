"use client";

import { WebhookIcon } from "lucide-react";
import {
  EmptyState,
  EmptyStateDescription,
  EmptyStateIcon,
  EmptyStateTitle,
} from "@/components/empty-state";
import { StackedList, StackedListItem } from "@/components/stacked-list";
import { Trans } from "@/i18n/client";
import type { getSpaceWebhooks } from "../data";
import { WebhookActions } from "./webhook-actions";
import { WebhookLastDelivery } from "./webhook-last-delivery";

type Webhook = Awaited<ReturnType<typeof getSpaceWebhooks>>[number];

export function WebhooksList({ webhooks }: { webhooks: Webhook[] }) {
  if (webhooks.length === 0) {
    return (
      <EmptyState>
        <EmptyStateIcon>
          <WebhookIcon />
        </EmptyStateIcon>
        <EmptyStateTitle>
          <Trans i18nKey="noWebhooks" defaults="No endpoints found" />
        </EmptyStateTitle>
        <EmptyStateDescription>
          <Trans
            i18nKey="noWebhooksDescription"
            defaults="Add an endpoint to be notified when your polls change"
          />
        </EmptyStateDescription>
      </EmptyState>
    );
  }

  return (
    <StackedList>
      {webhooks.map((webhook) => (
        <StackedListItem key={webhook.id}>
          <div className="flex min-w-0 flex-1 items-center gap-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border bg-card-accent">
              <WebhookIcon className="size-4 shrink-0 text-muted-foreground" />
            </div>
            <div className="min-w-0">
              {/* The switch is the enabled state; a badge repeating it would
                  be two controls for one fact. */}
              <div className="truncate font-semibold text-sm">
                {webhook.url}
              </div>
              <div className="truncate text-muted-foreground text-sm">
                <Trans
                  i18nKey="webhookEventCount"
                  defaults="{count, plural, one {# event} other {# events}}"
                  values={{ count: webhook.events.length }}
                />
              </div>
            </div>
          </div>
          <WebhookLastDelivery delivery={webhook.deliveries[0]} />
          <WebhookActions
            webhookId={webhook.id}
            webhookUrl={webhook.url}
            enabled={webhook.enabled}
          />
        </StackedListItem>
      ))}
    </StackedList>
  );
}
