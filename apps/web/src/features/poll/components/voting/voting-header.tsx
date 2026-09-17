"use client";
import { TimesShownIn } from "@/components/clock";
import { usePoll } from "@/features/poll/client";
import { useOptions } from "@/features/poll/components/poll-context";
import { Trans } from "@/i18n/client";

export function VotingHeader() {
  const poll = usePoll();
  const { pollType } = useOptions();

  return (
    <header className="sticky top-0 z-10 flex min-h-14 items-center justify-between gap-4 border-b bg-card px-4 py-2">
      <h2 className="font-medium text-sm">
        {pollType === "timeSlot" ? (
          <Trans
            i18nKey="votingPromptTimes"
            defaults="Please select as many times as possible"
          />
        ) : (
          <Trans
            i18nKey="votingPromptDates"
            defaults="Please select as many dates as possible"
          />
        )}
      </h2>
      {/* Floating-time polls have no zone to switch, and dates have no
          time format, so the control only appears on zoned time polls. */}
      {pollType === "timeSlot" && poll.timeZone ? <TimesShownIn /> : null}
    </header>
  );
}
