"use client";

import { Trans } from "@/i18n/client";
import { useDateTimeConfig } from "@/lib/datetime/client";
import { formatRelativeTime } from "@/lib/datetime/format";

export function RelativeDate({ date }: { date: Date }) {
  const { locale } = useDateTimeConfig();
  return (
    <Trans
      i18nKey="createdTime"
      defaults="Created {relativeTime}"
      values={{ relativeTime: formatRelativeTime(date, locale) }}
    />
  );
}
