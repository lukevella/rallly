"use client";

import { Trans } from "@/i18n/client";
import { useDateTimeConfig } from "@/lib/datetime/client";
import { formatDateTime } from "@/lib/datetime/format";
import { useHydrated } from "@/lib/datetime/use-hydrated";

// "Now" is read only after hydration, in the viewer's zone, so the server
// never renders a date the browser disagrees with.
export function TodayDate({ className }: { className?: string }) {
  const hydrated = useHydrated();
  const { locale, timeZone } = useDateTimeConfig();

  if (!hydrated || !timeZone) {
    return <p className={className}> </p>;
  }

  return (
    <p className={className}>
      <Trans
        i18nKey="homeTodayIs"
        defaults="Today is {date}"
        values={{
          date: formatDateTime(new Date(), {
            preset: "dateFull",
            locale,
            timeZone,
          }),
        }}
      />
    </p>
  );
}
