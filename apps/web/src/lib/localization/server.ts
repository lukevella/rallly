import "server-only";

import { cookies } from "next/headers";
import { cache } from "react";
import { getCurrentUser } from "@/auth/data";
import { getLocale } from "@/i18n/server/get-locale";
import {
  TIME_FORMAT_COOKIE,
  TIMEZONE_COOKIE,
  WEEK_START_COOKIE,
} from "@/lib/localization/constants";
import { getLocaleDefaults } from "@/lib/localization/locale-defaults";
import type { Localization } from "@/lib/localization/schema";
import { timeFormatSchema, weekStartSchema } from "@/lib/localization/schema";

/**
 * Resolves the viewer's localization for SSR.
 *
 * Each value falls back cookie → DB → locale default. The DB lookup is
 * short-circuited: `getCurrentUser()` only runs when a cookie is missing, so
 * anonymous/cookie-present viewers cost zero DB reads. `timeZone` has no locale
 * default and stays undefined for guests/anonymous viewers (resolved client-side).
 */
export const getLocalization = cache(async (): Promise<Localization> => {
  const [cookieStore, locale] = await Promise.all([cookies(), getLocale()]);

  const timeZoneCookie = cookieStore.get(TIMEZONE_COOKIE)?.value;
  const timeFormatCookie = timeFormatSchema.safeParse(
    cookieStore.get(TIME_FORMAT_COOKIE)?.value,
  );
  const weekStartCookie = weekStartSchema.safeParse(
    cookieStore.get(WEEK_START_COOKIE)?.value,
  );

  const needsDbFallback =
    !timeZoneCookie || !timeFormatCookie.success || !weekStartCookie.success;

  const user = needsDbFallback ? await getCurrentUser() : null;

  const defaults = getLocaleDefaults(locale);

  return {
    locale,
    timeZone: timeZoneCookie ?? user?.timeZone ?? undefined,
    timeFormat:
      (timeFormatCookie.success ? timeFormatCookie.data : undefined) ??
      user?.timeFormat ??
      defaults.timeFormat,
    weekStart:
      (weekStartCookie.success ? weekStartCookie.data : undefined) ??
      user?.weekStart ??
      defaults.weekStart,
  };
});
