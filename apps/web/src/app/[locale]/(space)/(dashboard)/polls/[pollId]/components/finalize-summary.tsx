"use client";

import { MailIcon } from "lucide-react";
import type { RankedOption } from "@/features/poll/components/finalize-poll-dialog";
import { SummaryStep } from "@/features/poll/components/finalize-poll-dialog";
import { Trans } from "@/i18n/client";

/**
 * What finalizing books and who hears about it: the event's date, location
 * and video call, then how many participants get an email. Each one is sent
 * separately, so this says so rather than listing recipients like a group
 * email would.
 */
export function FinalizeSummary({
  option,
  recipientCount,
}: {
  option: RankedOption;
  recipientCount: number;
}) {
  return (
    <div className="flex flex-col gap-4 rounded-xl border border-card-border bg-card px-5 py-4">
      <SummaryStep option={option} showPendingLink />
      <div className="flex items-start gap-3">
        <MailIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
        <p className="text-sm leading-5" data-testid="finalize-recipient-count">
          <Trans
            i18nKey="finalizeRecipientCount"
            defaults="{count, plural, =0 {No one will be emailed} one {# participant will get an email} other {# participants will each get their own email}}"
            values={{ count: recipientCount }}
          />
        </p>
      </div>
    </div>
  );
}
