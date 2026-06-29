// Locale reuses the existing `rallly_locale` cookie (see `@/lib/locale/constants`).
// Each preference gets its own cookie so the async timezone detector can't
// read-merge-write-clobber a concurrent change to a different preference.
export const TIMEZONE_COOKIE = "rallly_timezone";
export const TIME_FORMAT_COOKIE = "rallly_time_format";
export const WEEK_START_COOKIE = "rallly_week_start";
