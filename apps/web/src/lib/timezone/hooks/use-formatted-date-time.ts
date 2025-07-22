import type { ConfigType } from "dayjs";
import dayjs from "dayjs";

import { useTimezone } from "@/lib/timezone/client/context";

interface UseFormattedDateTimeOptions {
  /** A dayjs format string (e.g., "YYYY-MM-DD HH:mm", "h:mm A"). Defaults to a locale-aware format. */
  format?: string;
  /** If true, formats the time without applying the context timezone. Defaults to false. */
  floating?: boolean;
  /** Optional locale string (e.g., "en-US", "fr-FR"). Defaults to browser/system locale. */
  locale?: string;
}

/**
 * Hook to format a date/time value based on the current timezone context.
 *
 * @param date The date/time to format (Accepts Date, ISO string, Unix timestamp, Dayjs object).
 * @param options Formatting options including format string, floating flag, and locale.
 * @returns The formatted date/time string.
 */
export const useFormattedDateTime = (
  date: ConfigType | null | undefined,
  options: UseFormattedDateTimeOptions = {},
): string => {
  const { timezone } = useTimezone();
  const { format, floating = false, locale } = options;

  if (!date) {
    return "";
  }

  let dayjsInstance = dayjs(date);

  // Apply locale if provided
  if (locale) {
    dayjsInstance = dayjsInstance.locale(locale);
  }

  // Apply timezone unless floating is true
  if (!floating) {
    dayjsInstance = dayjsInstance.tz(timezone);
  }
  // For floating times, we might still want to ensure consistency,
  // especially if the input could be a Z-suffixed ISO string.
  // Converting to UTC first standardizes it before formatting without tz.
  else {
    dayjsInstance = dayjsInstance.utc();
  }

  return dayjsInstance.format(format ?? "LLLL");
};
