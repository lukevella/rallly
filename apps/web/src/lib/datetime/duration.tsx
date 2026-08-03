"use client";

import { Trans } from "@/i18n/client";

// Durations render from translation keys rather than Intl.DurationFormat:
// Intl output varies with the engine's ICU build, which desyncs server and
// client HTML, and emails need translated duration strings anyway.
export function Duration({
  minutes,
  className,
}: {
  minutes: number;
  className?: string;
}) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hours && mins) {
    return (
      <span className={className}>
        <Trans
          i18nKey="durationHoursMinutes"
          defaults="{hours, plural, one {#h} other {#h}} {minutes, plural, one {#m} other {#m}}"
          values={{ hours, minutes: mins }}
        />
      </span>
    );
  }

  if (hours) {
    return (
      <span className={className}>
        <Trans
          i18nKey="durationHours"
          defaults="{count, plural, one {#h} other {#h}}"
          values={{ count: hours }}
        />
      </span>
    );
  }

  return (
    <span className={className}>
      <Trans
        i18nKey="durationMinutes"
        defaults="{count, plural, one {#m} other {#m}}"
        values={{ count: mins }}
      />
    </span>
  );
}
