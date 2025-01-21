"use client";
import dayjs from "dayjs";

import { Trans } from "@/components/trans";

export function RelativeDate({ date }: { date: Date }) {
  return (
    <Trans
      i18nKey="createdTime"
      defaults="Created {relativeTime}"
      values={{ relativeTime: dayjs(date).fromNow() }}
    />
  );
}
