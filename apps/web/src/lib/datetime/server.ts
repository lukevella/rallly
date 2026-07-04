import "server-only";

import { cookies } from "next/headers";
import {
  TIME_FORMAT_COOKIE_NAME,
  TIME_ZONE_COOKIE_NAME,
  TIME_ZONE_OVERRIDE_COOKIE_NAME,
} from "@/lib/datetime/constants";
import { normalizeTimeFormat, normalizeTimeZone } from "@/lib/datetime/utils";

/**
 * Device-scoped datetime config for public pages: the viewer's current zone
 * and their per-device format choice. A session-scoped zone override (set
 * from the clock preferences dialog) wins over the detected zone.
 * Authenticated segments seed their provider from the user's stored
 * preferences instead. No zone means the viewer's first ever request —
 * components render times client-side once the zone is known.
 */
export async function getDeviceDateTimeConfig() {
  const cookieStore = await cookies();

  return {
    timeZone:
      normalizeTimeZone(
        cookieStore.get(TIME_ZONE_OVERRIDE_COOKIE_NAME)?.value,
      ) ?? normalizeTimeZone(cookieStore.get(TIME_ZONE_COOKIE_NAME)?.value),
    timeFormat: normalizeTimeFormat(
      cookieStore.get(TIME_FORMAT_COOKIE_NAME)?.value,
    ),
  };
}
