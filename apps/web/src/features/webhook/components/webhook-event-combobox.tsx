"use client";

import { Button } from "@rallly/ui/button";
import {
  Combobox,
  ComboboxCollection,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxInput,
  ComboboxItem,
  ComboboxLabel,
  ComboboxList,
  ComboboxTrigger,
  ComboboxValue,
} from "@rallly/ui/combobox";
import { Trans, useTranslation } from "@/i18n/client";
import type { WebhookEventType } from "../schema";
import { WEBHOOK_EVENT_TYPES } from "../schema";
import { groupWebhookEventTypes } from "../utils";
import { WebhookEventGroupLabel } from "./webhook-event-group-label";
import { WebhookEventLabel } from "./webhook-event-label";

const groupedEventTypes = groupWebhookEventTypes(WEBHOOK_EVENT_TYPES).map(
  ([resource, items]) => ({ value: resource, items }),
);

export function WebhookEventCombobox({
  id,
  value,
  onValueChange,
  onBlur,
  ...ariaProps
}: {
  id?: string;
  value: WebhookEventType[];
  onValueChange: (value: WebhookEventType[]) => void;
  onBlur?: () => void;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean;
}) {
  const { t } = useTranslation();

  return (
    <Combobox
      multiple
      items={groupedEventTypes}
      value={value}
      onValueChange={onValueChange}
    >
      <ComboboxTrigger
        id={id}
        onBlur={onBlur}
        {...ariaProps}
        render={
          <Button
            className="w-full justify-between font-normal aria-invalid:ring-destructive"
            type="button"
          />
        }
      >
        <ComboboxValue>
          {(selected: WebhookEventType[]) => (
            <Trans
              i18nKey="webhookEventCount"
              defaults="{count, plural, one {# event} other {# events}}"
              values={{ count: selected.length }}
            />
          )}
        </ComboboxValue>
      </ComboboxTrigger>
      <ComboboxContent>
        <ComboboxInput
          showTrigger={false}
          placeholder={t("webhookEventComboboxSearchPlaceholder", {
            defaultValue: "Search events…",
          })}
        />
        <ComboboxEmpty>
          <Trans
            i18nKey="webhookEventComboboxEmpty"
            defaults="No events found"
          />
        </ComboboxEmpty>
        <ComboboxList>
          {(group: (typeof groupedEventTypes)[number]) => (
            <ComboboxGroup key={group.value} items={group.items}>
              <ComboboxLabel>
                <WebhookEventGroupLabel resource={group.value} />
              </ComboboxLabel>
              <ComboboxCollection>
                {(eventType: WebhookEventType) => (
                  <ComboboxItem
                    key={eventType}
                    value={eventType}
                    className="items-start"
                  >
                    <span className="min-w-0">
                      <span className="block font-medium font-mono leading-none">
                        {eventType}
                      </span>
                      <span className="mt-1 block text-muted-foreground text-xs leading-snug">
                        <WebhookEventLabel eventType={eventType} />
                      </span>
                    </span>
                  </ComboboxItem>
                )}
              </ComboboxCollection>
            </ComboboxGroup>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}
