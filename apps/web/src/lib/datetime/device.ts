"use client";

import type { TimeFormat } from "@rallly/database";
import Cookies from "js-cookie";
import {
  TIME_FORMAT_COOKIE_NAME,
  TIME_ZONE_COOKIE_NAME,
  TIME_ZONE_OVERRIDE_COOKIE_NAME,
} from "@/lib/datetime/constants";

const cookieAttributes = {
  path: "/",
  sameSite: "lax",
  domain: process.env.NEXT_PUBLIC_COOKIE_DOMAIN,
} as const;

/**
 * Session-scoped zone override for viewing times in another zone; wins over
 * the detected zone (which TimeZoneSync keeps current). Picking the detected
 * zone clears the override so it can't pin a stale zone after travel.
 * No expiry: the override dies with the browser session.
 */
export function setTimeZoneOverride(timeZone: string) {
  if (timeZone === Cookies.get(TIME_ZONE_COOKIE_NAME)) {
    Cookies.remove(TIME_ZONE_OVERRIDE_COOKIE_NAME, cookieAttributes);
  } else {
    Cookies.set(TIME_ZONE_OVERRIDE_COOKIE_NAME, timeZone, cookieAttributes);
  }
}

/** Per-device time format choice, read by getDeviceDateTimeConfig. */
export function setDeviceTimeFormat(timeFormat: TimeFormat) {
  Cookies.set(TIME_FORMAT_COOKIE_NAME, timeFormat, {
    ...cookieAttributes,
    expires: 365,
  });
}
