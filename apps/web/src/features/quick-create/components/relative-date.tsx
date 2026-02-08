"use client";

import { Trans } from "@/components/trans";
import { dayjs } from "@/lib/dayjs";

export function RelativeDate({ date }: { date: Date }) {
  return (
    <Trans
      i18nKey="createdTime"
      defaults="Created {relativeTime}"
      values={{ relativeTime: dayjs(date).fromNow() }}
    />
  );
}
