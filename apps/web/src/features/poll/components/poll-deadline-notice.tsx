"use client";

import { CalendarClockIcon } from "lucide-react";
import { isPastDeadline } from "@/features/poll/utils";
import { Trans } from "@/i18n/client";
import { useDateTime } from "@/lib/datetime/client";
import { useHydrated } from "@/lib/datetime/use-hydrated";

/**
 * Tells participants when voting closes, or that it already has. Rendered
 * after hydration only: both the date and "is it past" depend on the
 * viewer's clock and time zone, which the server does not know.
 */
export function PollDeadlineNotice({ deadline }: { deadline: Date | null }) {
  const hydrated = useHydrated();
  const { formatDateTime } = useDateTime();

  if (!deadline || !hydrated) {
    return null;
  }

  const date = formatDateTime(deadline, "datetime");

  return (
    <p
      data-testid="poll-deadline-notice"
      className="flex items-center gap-2 text-muted-foreground text-sm"
    >
      <CalendarClockIcon className="size-4 shrink-0" />
      {isPastDeadline(deadline) ? (
        <Trans
          i18nKey="pollDeadlinePassed"
          defaults="Voting closed on {date}"
          values={{ date }}
        />
      ) : (
        <Trans
          i18nKey="pollDeadlineUpcoming"
          defaults="Voting closes on {date}"
          values={{ date }}
        />
      )}
    </p>
  );
}
