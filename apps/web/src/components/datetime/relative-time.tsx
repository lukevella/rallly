import type { DateInput } from "@/lib/localization/format";
import { formatRelativeTime } from "@/lib/localization/format";
import { toISO } from "./utils";

export type RelativeTimeProps = {
  value: DateInput;
  locale: string;
  className?: string;
};

export function RelativeTime({ value, locale, className }: RelativeTimeProps) {
  return (
    <time dateTime={toISO(value)} className={className}>
      {formatRelativeTime(value, locale)}
    </time>
  );
}
