"use client";

import type { TimeFormat } from "@rallly/database";
import Cookies from "js-cookie";
import {
  TIME_FORMAT_COOKIE,
  TIMEZONE_COOKIE,
  WEEK_START_COOKIE,
} from "@/lib/localization/constants";

const cookieOptions = {
  path: "/",
  domain: process.env.NEXT_PUBLIC_COOKIE_DOMAIN,
  expires: 400,
};

export function setTimeZoneCookie(timeZone: string) {
  Cookies.set(TIMEZONE_COOKIE, timeZone, cookieOptions);
}

export function setTimeFormatCookie(timeFormat: TimeFormat) {
  Cookies.set(TIME_FORMAT_COOKIE, timeFormat, cookieOptions);
}

export function setWeekStartCookie(weekStart: number) {
  Cookies.set(WEEK_START_COOKIE, String(weekStart), cookieOptions);
}
