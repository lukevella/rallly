"use client";
import { useDateTimeConfig } from "@/lib/datetime/client";
import { formatDateTime } from "@/lib/datetime/format";
import type { DateInput } from "@/lib/datetime/types";
import { useHydrated } from "@/lib/datetime/use-hydrated";
import { toISODate } from "@/lib/datetime/utils";

/** A date option's label: the full date, in the locale's own order. */
export function OptionDate({ value }: { value: DateInput }) {
  const hydrated = useHydrated();
  const { locale } = useDateTimeConfig();

  // Intl output isn't stable across engines, so it can't be rendered on the
  // server; hold the row's height until hydration.
  if (!hydrated) {
    return <time dateTime={toISODate(value)}> </time>;
  }

  return (
    <time dateTime={toISODate(value)} className="truncate">
      {/* All-day dates are stored as UTC wall time and read back in UTC. */}
      {formatDateTime(value, {
        preset: "dateFull",
        locale,
        timeZone: "UTC",
      })}
    </time>
  );
}
