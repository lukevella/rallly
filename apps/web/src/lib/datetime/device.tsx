"use client";

import type { TimeFormat } from "@rallly/database";
import Cookies from "js-cookie";
import React from "react";
import { DateTimeProvider } from "@/lib/datetime/client";
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
function setTimeZoneOverrideCookie(timeZone: string) {
  if (timeZone === Cookies.get(TIME_ZONE_COOKIE_NAME)) {
    Cookies.remove(TIME_ZONE_OVERRIDE_COOKIE_NAME, cookieAttributes);
  } else {
    Cookies.set(TIME_ZONE_OVERRIDE_COOKIE_NAME, timeZone, cookieAttributes);
  }
}

function setTimeFormatCookie(timeFormat: TimeFormat) {
  Cookies.set(TIME_FORMAT_COOKIE_NAME, timeFormat, {
    ...cookieAttributes,
    expires: 365,
  });
}

type DeviceDateTime = {
  setTimeZone: (timeZone: string) => void;
  setTimeFormat: (timeFormat: TimeFormat) => void;
};

const DeviceDateTimeContext = React.createContext<DeviceDateTime | null>(null);

/**
 * DateTimeProvider for device-configured segments (public pages): the
 * setters update state so the UI responds instantly, and persist to cookies
 * so the next server render agrees. Seed it with the values from
 * getDeviceDateTimeConfig.
 */
export function DeviceDateTimeProvider({
  timeZone: initialTimeZone,
  timeFormat: initialTimeFormat,
  weekStart,
  children,
}: {
  timeZone?: string;
  timeFormat?: TimeFormat;
  weekStart?: number;
  children: React.ReactNode;
}) {
  const [timeZone, setTimeZoneState] = React.useState(initialTimeZone);
  const [timeFormat, setTimeFormatState] = React.useState(initialTimeFormat);

  const value = React.useMemo<DeviceDateTime>(
    () => ({
      setTimeZone: (newTimeZone) => {
        setTimeZoneState(newTimeZone);
        setTimeZoneOverrideCookie(newTimeZone);
      },
      setTimeFormat: (newTimeFormat) => {
        setTimeFormatState(newTimeFormat);
        setTimeFormatCookie(newTimeFormat);
      },
    }),
    [],
  );

  return (
    <DeviceDateTimeContext.Provider value={value}>
      <DateTimeProvider
        timeZone={timeZone}
        timeFormat={timeFormat}
        weekStart={weekStart}
      >
        {children}
      </DateTimeProvider>
    </DeviceDateTimeContext.Provider>
  );
}

export function useDeviceDateTime() {
  const context = React.useContext(DeviceDateTimeContext);
  if (!context) {
    throw new Error(
      "useDeviceDateTime must be used within a DeviceDateTimeProvider",
    );
  }
  return context;
}
