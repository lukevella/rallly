"use client";

import { Trans } from "@/i18n/client";
import { useDateTime } from "@/lib/datetime/client";

export function RelativeDate({ date }: { date: Date }) {
  const { toRelativeTime } = useDateTime();
  return (
    <Trans
      i18nKey="createdTime"
      defaults="Created {relativeTime}"
      values={{ relativeTime: toRelativeTime(date) }}
    />
  );
}
