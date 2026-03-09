import { normalizeLegacyIanaId } from "@/utils/timezone-schema";

export function getAllTimezoneIds(): string[] {
  return Intl.supportedValuesOf("timeZone");
}

export function getCityFromTimezoneId(id: string): string {
  const resolved = normalizeLegacyIanaId(id);
  const lastSlash = resolved.lastIndexOf("/");
  return resolved.substring(lastSlash + 1).replaceAll("_", " ");
}

// Curated set of major cities/timezones covering most common UTC offsets.
// Some rare offsets (e.g. UTC-9:30, UTC+8:45, UTC+12:45) are omitted intentionally.
export const curatedTimezoneIds = new Set([
  // UTC-11 to UTC-10
  "Pacific/Pago_Pago",
  "Pacific/Honolulu",

  // UTC-9 to UTC-8
  "America/Anchorage",
  "America/Los_Angeles",
  "America/Vancouver",

  // UTC-7
  "America/Denver",
  "America/Phoenix",

  // UTC-6
  "America/Chicago",
  "America/Mexico_City",

  // UTC-5
  "America/Bogota",
  "America/Lima",
  "America/New_York",
  "America/Toronto",

  // UTC-4
  "America/Caracas",
  "America/Halifax",
  "America/Santiago",

  // UTC-3:30
  "America/St_Johns",

  // UTC-3
  "America/Argentina/Buenos_Aires",
  "America/Sao_Paulo",

  // UTC-2
  "Atlantic/South_Georgia",

  // UTC-1
  "Atlantic/Azores",
  "Atlantic/Cape_Verde",

  // UTC+0
  "Africa/Accra",
  "Africa/Casablanca",
  "Europe/Dublin",
  "Europe/Lisbon",
  "Europe/London",

  // UTC+1
  "Africa/Lagos",
  "Europe/Amsterdam",
  "Europe/Berlin",
  "Europe/Brussels",
  "Europe/Madrid",
  "Europe/Paris",
  "Europe/Rome",
  "Europe/Stockholm",
  "Europe/Warsaw",
  "Europe/Zurich",

  // UTC+2
  "Africa/Cairo",
  "Africa/Johannesburg",
  "Asia/Beirut",
  "Asia/Jerusalem",
  "Europe/Athens",
  "Europe/Bucharest",
  "Europe/Helsinki",
  "Europe/Istanbul",
  "Europe/Kyiv",

  // UTC+3
  "Asia/Baghdad",
  "Asia/Riyadh",
  "Europe/Moscow",

  // UTC+3:30
  "Asia/Tehran",

  // UTC+4
  "Asia/Dubai",

  // UTC+4:30
  "Asia/Kabul",

  // UTC+5
  "Asia/Karachi",
  "Asia/Tashkent",

  // UTC+5:30
  "Asia/Kolkata",

  // UTC+5:45
  "Asia/Kathmandu",

  // UTC+6
  "Asia/Dhaka",

  // UTC+6:30
  "Asia/Yangon",

  // UTC+7
  "Asia/Bangkok",
  "Asia/Jakarta",
  "Asia/Ho_Chi_Minh",

  // UTC+8
  "Asia/Hong_Kong",
  "Asia/Manila",
  "Asia/Shanghai",
  "Asia/Singapore",
  "Asia/Taipei",
  "Australia/Perth",

  // UTC+9
  "Asia/Seoul",
  "Asia/Tokyo",

  // UTC+9:30
  "Australia/Adelaide",

  // UTC+10
  "Australia/Melbourne",
  "Australia/Sydney",

  // UTC+11
  "Pacific/Noumea",

  // UTC+12
  "Pacific/Auckland",
  "Pacific/Fiji",

  // UTC+13
  "Pacific/Apia",
  "Pacific/Tongatapu",
]);
