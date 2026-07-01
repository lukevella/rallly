import type { DateInput } from "@/lib/datetime/format";
import { formatRelativeTime } from "@/lib/datetime/format";
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
