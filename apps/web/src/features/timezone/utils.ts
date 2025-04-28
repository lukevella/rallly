import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";

// Initialize dayjs plugins
dayjs.extend(utc);
dayjs.extend(timezone);

/**
 * Get the browser's timezone
 */
export const getBrowserTimezone = (): string => {
  if (typeof window !== "undefined") {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  }
  return "UTC";
};

/**
 * Get a list of all available timezones
 */
export const getAllTimezones = (): string[] => {
  // This is a simplified list - in a real implementation, you might want to use a more comprehensive list
  return [
    "UTC",
    "Africa/Cairo",
    "Africa/Johannesburg",
    "Africa/Lagos",
    "America/Anchorage",
    "America/Bogota",
    "America/Chicago",
    "America/Denver",
    "America/Los_Angeles",
    "America/Mexico_City",
    "America/New_York",
    "America/Phoenix",
    "America/Sao_Paulo",
    "America/Toronto",
    "Asia/Bangkok",
    "Asia/Dubai",
    "Asia/Hong_Kong",
    "Asia/Jakarta",
    "Asia/Kolkata",
    "Asia/Seoul",
    "Asia/Shanghai",
    "Asia/Singapore",
    "Asia/Tokyo",
    "Australia/Melbourne",
    "Australia/Perth",
    "Australia/Sydney",
    "Europe/Amsterdam",
    "Europe/Berlin",
    "Europe/Istanbul",
    "Europe/London",
    "Europe/Madrid",
    "Europe/Moscow",
    "Europe/Paris",
    "Europe/Rome",
    "Pacific/Auckland",
    "Pacific/Honolulu",
  ];
};

/**
 * Convert a date from one timezone to another
 */
export const convertTimezone = (
  date: string | Date | dayjs.Dayjs,
  fromTimezone: string,
  toTimezone: string,
): dayjs.Dayjs => {
  return dayjs(date).tz(fromTimezone).tz(toTimezone);
};

/**
 * Format a date for display with timezone
 */
export const formatWithTimezone = (
  date: string | Date | dayjs.Dayjs,
  timezone: string,
  format: string,
): string => {
  return dayjs(date).tz(timezone).format(format);
};

/**
 * Get the timezone offset as a string (e.g., "UTC+1:00")
 */
export const getTimezoneOffset = (timezone: string): string => {
  const offset = dayjs().tz(timezone).format("Z");
  return `UTC${offset}`;
};

/**
 * Group timezones by offset
 */
export const groupTimezonesByOffset = (): Record<string, string[]> => {
  const timezones = getAllTimezones();
  const grouped: Record<string, string[]> = {};

  // biome-ignore lint/complexity/noForEach: Fix this later
  timezones.forEach((tz) => {
    const offset = dayjs().tz(tz).format("Z");
    if (!grouped[offset]) {
      grouped[offset] = [];
    }
    grouped[offset].push(tz);
  });

  return grouped;
};
