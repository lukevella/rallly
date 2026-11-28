"use client";

import { useParticipants, usePoll } from "@/features/poll/client";
import type { RankedOption } from "@/features/poll/components/finalize-poll-dialog";
import { SummaryStep } from "@/features/poll/components/finalize-poll-dialog";
import { Trans, useTranslation } from "@/i18n/client";

// Past this many, the rest of the recipients are counted, not named.
const NAMED_RECIPIENTS = 3;

/**
 * The email participants get once the poll is finalized, as a preview: who it
 * goes to, then its message and the event it carries. The copy mirrors the
 * finalized participant email in `packages/emails`; the line about each
 * participant's own vote is left out because it differs per recipient.
 */
export function FinalizeEmailPreview({
  option,
  recipientIds,
}: {
  option: RankedOption;
  recipientIds: Set<string>;
}) {
  const poll = usePoll();
  const { participants } = useParticipants();
  const { i18n } = useTranslation();
  const names = participants
    .filter((p) => recipientIds.has(p.id))
    .map((p) => p.name);
  const list = new Intl.ListFormat(i18n.language, {
    style: "long",
    type: "conjunction",
  });

  return (
    <div className="overflow-hidden rounded-xl border border-card-border bg-card">
      <div className="flex gap-2 border-card-border border-b px-5 py-3 text-sm">
        <span className="w-8 shrink-0 text-muted-foreground">
          <Trans i18nKey="finalizePreviewTo" defaults="To" />
        </span>
        <span className="min-w-0" data-testid="finalize-preview-recipients">
          {names.length === 0 ? (
            <span className="text-muted-foreground">
              <Trans
                i18nKey="finalizePreviewNoOne"
                defaults="No one. Nobody will be emailed."
              />
            </span>
          ) : names.length <= NAMED_RECIPIENTS ? (
            list.format(names)
          ) : (
            <Trans
              i18nKey="finalizePreviewRecipientsMore"
              defaults="{names} and {count, plural, one {# other} other {# others}}"
              values={{
                names: names.slice(0, NAMED_RECIPIENTS - 1).join(", "),
                count: names.length - (NAMED_RECIPIENTS - 1),
              }}
            />
          )}
        </span>
      </div>
      <div className="flex flex-col gap-4 px-5 py-5 text-sm">
        <p className="font-medium text-base">
          <Trans
            i18nKey="finalizePreviewHeading"
            defaults="Final date booked!"
          />
        </p>
        <p>
          <Trans
            i18nKey="finalizePreviewIntro"
            defaults="<b>{hostName}</b> has booked <b>{title}</b> for the following date:"
            values={{ hostName: poll.user?.name ?? "", title: poll.title }}
            components={{ b: <strong className="font-medium" /> }}
          />
        </p>
        <SummaryStep option={option} showPendingLink />
        <p>
          <Trans
            i18nKey="finalizePreviewAttachment"
            defaults="Please find attached a calendar invite for this event."
          />
        </p>
      </div>
    </div>
  );
}
