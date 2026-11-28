"use client";

import { useParticipants } from "@/features/poll/client";
import type { RankedOption } from "@/features/poll/components/finalize-poll-dialog";
import { SummaryStep } from "@/features/poll/components/finalize-poll-dialog";
import { Trans, useTranslation } from "@/i18n/client";

// Past this many, the rest of the recipients are counted, not named.
const NAMED_RECIPIENTS = 3;

/**
 * What the finalized email carries: who it goes to, then the event's date,
 * location and video call.
 */
export function FinalizeEmailPreview({
  option,
  recipientIds,
}: {
  option: RankedOption;
  recipientIds: Set<string>;
}) {
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
      <div className="px-5 py-4">
        <SummaryStep option={option} showPendingLink />
      </div>
    </div>
  );
}
