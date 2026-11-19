import "server-only";

import { getPreferredLanguagesFromHeaders } from "@rallly/languages/get-preferred-locale";
import { cookies, headers } from "next/headers";
import { getLocale } from "@/i18n/server/get-locale";
import {
  TIME_FORMAT_COOKIE_NAME,
  TIME_ZONE_COOKIE_NAME,
  TIME_ZONE_OVERRIDE_COOKIE_NAME,
} from "@/lib/datetime/constants";
import { getWeekStartFromLanguageTags } from "@/lib/datetime/locales";
import { normalizeTimeFormat, normalizeTimeZone } from "@/lib/datetime/utils";

/**
 * Device-scoped datetime config for public pages: the viewer's current zone
 * and their per-device format choice. A session-scoped zone override (set
 * from the clock preferences dialog) wins over the detected zone.
 * Authenticated segments seed their provider from the user's stored
 * preferences instead. No zone means the viewer's first ever request —
 * components render times client-side once the zone is known.
 */
/**
 * The viewer's current zone as reported by the device cookie, ignoring the
 * session zone override — the override is a poll-viewing aid ("see what
 * other participants see"), not a statement about where the viewer is now.
 * Use for classifying moments against the viewer's present (e.g. upcoming
 * counts); use getDeviceDateTimeConfig for display on public pages.
 */
export async function getDeviceTimeZone() {
  const cookieStore = await cookies();
  return normalizeTimeZone(cookieStore.get(TIME_ZONE_COOKIE_NAME)?.value);
}

/**
 * Viewers without a stored week start get this so the server and client
 * render the same calendar.
 */
async function getDeviceWeekStart() {
  const [locale, headersList] = await Promise.all([getLocale(), headers()]);
  const acceptLanguageHeader = headersList.get("accept-language");
  if (!acceptLanguageHeader) {
    return undefined;
  }
  return getWeekStartFromLanguageTags({
    locale,
    tags: getPreferredLanguagesFromHeaders({ acceptLanguageHeader }),
  });
}

export async function getDeviceDateTimeConfig() {
  const [cookieStore, weekStart] = await Promise.all([
    cookies(),
    getDeviceWeekStart(),
  ]);

  return {
    timeZone:
      normalizeTimeZone(
        cookieStore.get(TIME_ZONE_OVERRIDE_COOKIE_NAME)?.value,
      ) ?? normalizeTimeZone(cookieStore.get(TIME_ZONE_COOKIE_NAME)?.value),
    timeFormat: normalizeTimeFormat(
      cookieStore.get(TIME_FORMAT_COOKIE_NAME)?.value,
    ),
    weekStart,
  };
}
