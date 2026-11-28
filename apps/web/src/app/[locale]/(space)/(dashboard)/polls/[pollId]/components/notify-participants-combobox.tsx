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
import VoteIcon from "@/features/poll/components/vote-icon";
import type { VoteType } from "@/features/poll/constants";
import { VOTE_TYPES } from "@/features/poll/constants";
import { Trans, useTranslation } from "@/i18n/client";

type Recipient = {
  id: string;
  name: string;
  email: string;
  vote: VoteType | undefined;
};

// Yes first, then if need be, then no, then people who didn't vote.
function voteRank(vote: VoteType | undefined) {
  return vote ? VOTE_TYPES.indexOf(vote) : VOTE_TYPES.length;
}

/**
 * Who gets the finalized email, as removable chips; the list shows each
 * participant's vote on the date being finalized. Only participants
 * with an email can be picked, and picking no one finalizes silently.
 */
export function NotifyParticipantsCombobox({
  id,
  optionId,
  selectedIds,
  onChange,
}: {
  id: string;
  optionId: string;
  selectedIds: Set<string>;
  onChange: (next: Set<string>) => void;
}) {
  const { t } = useTranslation();
  const { participants } = useParticipants();
  const anchorRef = useComboboxAnchor();
  const recipients = React.useMemo(
    () =>
      participants
        .flatMap((p) =>
          p.email
            ? [
                {
                  id: p.id,
                  name: p.name,
                  email: p.email,
                  vote: p.votes.find((v) => v.optionId === optionId)?.type,
                },
              ]
            : [],
        )
        .sort((a, b) => voteRank(a.vote) - voteRank(b.vote)),
    [participants, optionId],
  );
  const selected = recipients.filter((r) => selectedIds.has(r.id));

  return (
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
        className="max-h-32 min-h-0 overflow-y-auto border-0 bg-transparent px-0 py-0 focus-within:ring-0 has-data-[slot=combobox-chip]:px-0 dark:bg-transparent"
      >
        {selected.map((recipient) => (
          <ComboboxChip key={recipient.id}>{recipient.name}</ComboboxChip>
        ))}
        <ComboboxChipsInput
          id={id}
          placeholder={
            selected.length === 0
              ? t("notifyComboboxNoOne", { defaultValue: "No one" })
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
              <VoteIcon type={recipient.vote} round={true} size="sm" />
              <span className="min-w-0 flex-1 truncate">{recipient.name}</span>
              <span className="min-w-0 truncate text-muted-foreground text-xs">
                {recipient.email}
              </span>
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}
