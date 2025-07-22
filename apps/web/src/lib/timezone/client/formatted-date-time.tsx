"use client";

import type { ConfigType } from "dayjs";
import dayjs from "dayjs";
import * as React from "react";

import { useFormattedDateTime } from "@/lib/timezone/hooks/use-formatted-date-time";

interface FormattedDateTimeProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** The date/time to format (Accepts Date, ISO string, Unix timestamp, Dayjs object). */
  date: ConfigType | null | undefined;
  /** A dayjs format string (e.g., "YYYY-MM-DD HH:mm", "h:mm A"). Defaults to a locale-aware format. */
  format?: string;
  /** If true, formats the time without applying the context timezone. Defaults to false. */
  floating?: boolean;
  /** Optional locale string (e.g., "en-US", "fr-FR"). Defaults to browser/system locale. */
  locale?: string;
}

/**
 * Component to render a formatted date/time string based on the current timezone context.
 *
 * Uses the `useFormattedDateTime` hook internally.
 */
export const FormattedDateTime = React.forwardRef<
  HTMLTimeElement,
  FormattedDateTimeProps
>(({ date, format, floating, locale, ...props }, ref) => {
  const formattedDate = useFormattedDateTime(date, {
    format,
    floating,
    locale,
  });

  return (
    <time
      dateTime={date ? dayjs(date).toISOString() : new Date().toISOString()}
      ref={ref}
      {...props}
    >
      {formattedDate}
    </time>
  );
});

FormattedDateTime.displayName = "FormattedDateTime";
