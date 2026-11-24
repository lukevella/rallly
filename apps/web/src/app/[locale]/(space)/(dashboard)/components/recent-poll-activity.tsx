"use client";

import { StatCardDetail } from "@/components/stat-card";
import { Trans } from "@/i18n/client";
import { RelativeTime } from "@/lib/datetime/relative-time";
import { useHydrated } from "@/lib/datetime/use-hydrated";

const RECENT_MS = 7 * 24 * 60 * 60 * 1000;

// Hidden once the activity is over a week old: "3 months ago" says the polls
// are quiet, which the card doesn't need to point out. Read after hydration
// so "now" is the viewer's clock.
export function RecentPollActivity({ value }: { value: Date }) {
  const hydrated = useHydrated();

  if (!hydrated || Date.now() - value.getTime() > RECENT_MS) {
    return null;
  }

  return (
    <StatCardDetail>
      <Trans
        i18nKey="homePollsActive"
        defaults="Active <time />"
        components={{ time: <RelativeTime value={value} /> }}
      />
    </StatCardDetail>
  );
}
