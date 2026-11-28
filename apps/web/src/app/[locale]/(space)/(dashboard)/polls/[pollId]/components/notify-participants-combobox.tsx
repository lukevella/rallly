"use client";

import { Button } from "@rallly/ui/button";
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
import { XIcon } from "lucide-react";
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

// Past this many, the rest collapse into a "+N more" chip.
const VISIBLE_CHIPS = 6;

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
  const [open, setOpen] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const hidden = selected.length - VISIBLE_CHIPS;

  return (
    <Combobox
      multiple
      open={open}
      onOpenChange={setOpen}
      items={recipients}
      value={selected}
      onValueChange={(next: Recipient[]) =>
        onChange(new Set(next.map((r) => r.id)))
      }
      itemToStringLabel={(r: Recipient) => r.name}
      isItemEqualToValue={(a: Recipient, b: Recipient) => a.id === b.id}
    >
      <div className="flex items-start gap-2">
        <ComboboxChips
          ref={anchorRef}
          className="min-h-0 flex-1 border-0 bg-transparent px-0 py-0 focus-within:ring-0 has-data-[slot=combobox-chip]:px-0 dark:bg-transparent"
        >
          {selected.slice(0, VISIBLE_CHIPS).map((recipient) => (
            <ComboboxChip key={recipient.id} className="font-normal">
              {recipient.name}
            </ComboboxChip>
          ))}
          {hidden > 0 ? (
            <button
              type="button"
              className="flex h-[calc(--spacing(5.25))] items-center rounded-sm bg-muted px-1.5 text-muted-foreground text-xs hover:text-foreground"
              onClick={() => {
                inputRef.current?.focus();
                setOpen(true);
              }}
            >
              <Trans
                i18nKey="notifyComboboxMore"
                defaults="+{count} more"
                values={{ count: hidden }}
              />
            </button>
          ) : null}
          <ComboboxChipsInput
            ref={inputRef}
            id={id}
            placeholder={
              selected.length === 0
                ? t("notifyComboboxNoOne", { defaultValue: "No one" })
                : undefined
            }
          />
        </ComboboxChips>
        {selected.length > 0 ? (
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label={t("notifyComboboxClearAll", {
              defaultValue: "Remove everyone",
            })}
            onClick={() => onChange(new Set())}
          >
            <XIcon aria-hidden="true" />
          </Button>
        ) : null}
      </div>
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
