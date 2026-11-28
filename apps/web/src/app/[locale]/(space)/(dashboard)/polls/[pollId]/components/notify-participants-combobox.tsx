"use client";

import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
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
 * Who gets the finalized email. The field says how many are picked; the list
 * shows each participant's vote on the date being finalized. Only participants
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
      {/* The selection lives in the popup, so the input's only resting
            text is the count; typing replaces it with a query. */}
      <ComboboxInput
        id={id}
        className="w-full border-transparent shadow-none dark:bg-transparent"
        showClear={selected.length > 0}
        placeholder={t("notifyComboboxCount", {
          defaultValue:
            "{count, plural, =0 {No one} one {# participant} other {# participants}}",
          count: selected.length,
        })}
      />
      <ComboboxContent>
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
