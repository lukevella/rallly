"use client";

import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  useComboboxAnchor,
} from "@rallly/ui/combobox";
import React from "react";
import { useParticipants } from "@/features/poll/client";
import { Trans, useTranslation } from "@/i18n/client";

type Recipient = { id: string; name: string; email: string };

/**
 * Who gets the finalized email, as removable chips. Only participants with an
 * email can be picked; removing every chip finalizes without notifying anyone.
 */
export function NotifyParticipantsCombobox({
  selectedIds,
  onChange,
}: {
  selectedIds: Set<string>;
  onChange: (next: Set<string>) => void;
}) {
  const { t } = useTranslation();
  const { participants } = useParticipants();
  const anchorRef = useComboboxAnchor();
  const recipients = React.useMemo(
    () =>
      participants.flatMap((p) =>
        p.email ? [{ id: p.id, name: p.name, email: p.email }] : [],
      ),
    [participants],
  );
  const selected = recipients.filter((r) => selectedIds.has(r.id));
  const withoutEmail = participants.length - recipients.length;

  return (
    <div className="flex flex-col gap-2">
      <Combobox
        multiple
        items={recipients}
        value={selected}
        onValueChange={(next: Recipient[]) =>
          onChange(new Set(next.map((r) => r.id)))
        }
        itemToStringLabel={(r: Recipient) => r.name}
        isItemEqualToValue={(a: Recipient, b: Recipient) => a.id === b.id}
      >
        <ComboboxChips
          ref={anchorRef}
          className="max-h-32 overflow-y-auto py-1.5"
        >
          {selected.map((recipient) => (
            <ComboboxChip key={recipient.id}>{recipient.name}</ComboboxChip>
          ))}
          <ComboboxChipsInput
            aria-label={t("notifyComboboxLabel", {
              defaultValue: "Participants to notify",
            })}
            placeholder={
              selected.length === 0
                ? t("notifyComboboxPlaceholder", {
                    defaultValue: "No one will be notified",
                  })
                : undefined
            }
          />
        </ComboboxChips>
        <ComboboxContent anchor={anchorRef.current}>
          <ComboboxEmpty>
            <Trans
              i18nKey="notifyComboboxEmpty"
              defaults="No participants found"
            />
          </ComboboxEmpty>
          <ComboboxList>
            {(recipient: Recipient) => (
              <ComboboxItem key={recipient.id} value={recipient}>
                <span className="min-w-0 flex-1 truncate">
                  {recipient.name}
                </span>
                <span className="min-w-0 truncate text-muted-foreground text-xs">
                  {recipient.email}
                </span>
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
      {withoutEmail > 0 ? (
        <p className="text-muted-foreground text-xs">
          <Trans
            i18nKey="notifyComboboxWithoutEmail"
            defaults="{count, plural, one {# participant has no email and won't be notified.} other {# participants have no email and won't be notified.}}"
            values={{ count: withoutEmail }}
          />
        </p>
      ) : null}
    </div>
  );
}
