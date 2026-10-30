"use client";

import { CalendarClockIcon } from "lucide-react";
import * as React from "react";
import { isPastDeadline } from "@/features/poll/utils";
import { Trans } from "@/i18n/client";
import { useDateTime } from "@/lib/datetime/client";
import { useHydrated } from "@/lib/datetime/use-hydrated";

// setTimeout overflows past this delay and would fire immediately.
const MAX_TIMEOUT_MS = 2_147_483_647;

/**
 * Tells participants when voting closes, or that it already has. Rendered
 * after hydration only: both the date and "is it past" depend on the
 * viewer's clock and time zone, which the server does not know.
 */
export function PollDeadlineNotice({ deadline }: { deadline: Date | null }) {
  const hydrated = useHydrated();
  const { formatDateTime } = useDateTime();
  const [tick, setTick] = React.useState(0);
  const deadlineTime = deadline?.getTime();

  // Switches to the "closed" wording when the deadline passes on an open page.
  // biome-ignore lint/correctness/useExhaustiveDependencies: tick re-arms the timer after a clamped delay
  React.useEffect(() => {
    if (deadlineTime === undefined) {
      return;
    }
    const remaining = deadlineTime - Date.now();
    if (remaining <= 0) {
      return;
    }
    const timer = setTimeout(
      () => setTick((value) => value + 1),
      Math.min(remaining, MAX_TIMEOUT_MS),
    );
    return () => clearTimeout(timer);
  }, [deadlineTime, tick]);

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
