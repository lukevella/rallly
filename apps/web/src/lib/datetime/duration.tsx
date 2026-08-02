"use client";

import { useDateTimeConfig } from "@/lib/datetime/client";
import { formatDuration } from "@/lib/datetime/format";
import { useHydrated } from "@/lib/datetime/use-hydrated";

export function Duration({
  minutes,
  className,
}: {
  minutes: number;
  className?: string;
}) {
  const hydrated = useHydrated();
  const { locale } = useDateTimeConfig();

  // Intl output isn't stable across engines, so it can't be rendered on the
  // server; render a non-breaking space (preserves the line height) until
  // hydration.
  if (!hydrated) {
    return <span className={className}> </span>;
  }

  return <span className={className}>{formatDuration(minutes, locale)}</span>;
}
