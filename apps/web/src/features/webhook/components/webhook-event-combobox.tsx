"use client";

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
  useComboboxAnchor,
} from "@rallly/ui/combobox";
import { Trans, useTranslation } from "@/i18n/client";
import type { WebhookEventType } from "../schema";
import { WEBHOOK_EVENT_TYPES } from "../schema";
import { groupWebhookEventTypes } from "../utils";
import { WebhookEventGroupLabel } from "./webhook-event-group-label";

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
  const anchorRef = useComboboxAnchor();

  return (
    <Combobox
      multiple
      items={groupedEventTypes}
      value={value}
      onValueChange={onValueChange}
    >
      <div ref={anchorRef}>
        {/* The selection lives in the popup, so the input's only resting
            text is the selected count; typing replaces it with a query. */}
        <ComboboxInput
          id={id}
          onBlur={onBlur}
          placeholder={t("webhookEventCount", {
            defaultValue: "{count, plural, one {# event} other {# events}}",
            count: value.length,
          })}
          {...ariaProps}
        />
      </div>
      <ComboboxContent anchor={anchorRef.current}>
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
                    className="font-mono"
                  >
                    {eventType}
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
