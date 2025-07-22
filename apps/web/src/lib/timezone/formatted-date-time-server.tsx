import { cn } from "@rallly/ui";
import type { ConfigType } from "dayjs";
import dayjs from "dayjs";
import type * as React from "react";

interface FormattedDateTimeServerProps
  extends Omit<React.HTMLAttributes<HTMLTimeElement>, "dateTime"> {
  /** The date/time to format (Accepts Date, ISO string, Unix timestamp, Dayjs object). */
  date: ConfigType | null | undefined;
  /** The IANA timezone string to use for formatting. Required for server component. */
  timezone: string;
  /** A dayjs format string (e.g., "YYYY-MM-DD HH:mm", "h:mm A"). Defaults to a locale-aware format. */
  format?: string;
  /** If true, formats the time without applying the context timezone. Defaults to false. */
  floating?: boolean;
  /** Optional locale string (e.g., "en-US", "fr-FR"). Defaults to browser/system locale if applicable on server, otherwise server default. */
  locale?: string;
}

/**
 * Server Component to render a formatted date/time string based on a provided timezone.
 *
 * Does NOT use React Context.
 */
export const FormattedDateTimeServer = ({
  date,
  timezone,
  format,
  floating = false,
  locale,
  className,
  ...props
}: FormattedDateTimeServerProps) => {
  if (!date) {
    return null; // Return null for invalid dates
  }

  let dayjsInstance = dayjs(date);

  // Apply locale if provided
  if (locale) {
    dayjsInstance = dayjsInstance.locale(locale);
  }

  // Apply timezone unless floating is true
  if (!floating) {
    try {
      dayjsInstance = dayjsInstance.tz(timezone);
    } catch (error) {
      console.warn(
        `FormattedDateTimeServer: Invalid timezone provided: "${timezone}". Falling back.`,
        error,
      );
      // Fallback or default behavior if timezone is invalid
      // Might default to UTC or system time depending on Dayjs config
    }
  } else {
    // Standardize floating times to UTC before formatting without tz
    dayjsInstance = dayjsInstance.utc();
  }

  // Determine the format string
  const defaultFormat = floating ? "LT" : "LLLL"; // LT for floating, LLLL for timezone-aware
  const formatString = format ?? defaultFormat;

  const formattedDate = dayjsInstance.format(formatString);
  // Provide machine-readable dateTime attribute, usually in ISO format
  const machineReadableDate = dayjs(date).toISOString();

  return (
    <time dateTime={machineReadableDate} className={cn(className)} {...props}>
      {formattedDate}
    </time>
  );
};
