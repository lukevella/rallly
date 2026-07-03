"use client";

import Cookies from "js-cookie";
import React from "react";
import { TIME_ZONE_COOKIE_NAME } from "@/lib/datetime/constants";
import { getBrowserTimeZone } from "@/utils/date-time-utils";

type TimeZoneChange = {
  previousTimeZone: string;
  currentTimeZone: string;
  /** Consume the change so no other surface prompts for it again. */
  acknowledge: () => void;
};

const TimeZoneChangeContext = React.createContext<TimeZoneChange | null>(null);

/**
 * Keeps the timeZone cookie in sync with the browser-detected zone and
 * exposes the change event through context. Detection must happen here: this
 * is the only place that sees the previous and current zone atomically —
 * consumers (e.g. TimeZoneMismatchDialog) may mount before or after the sync
 * runs depending on streaming and navigation, so they read the event from
 * context instead of the cookie. The cookie always means "the viewer's
 * current zone"; preference actions never write it.
 */
export function TimeZoneSync({ children }: { children: React.ReactNode }) {
  const [change, setChange] = React.useState<{
    previousTimeZone: string;
    currentTimeZone: string;
  } | null>(null);

  React.useEffect(() => {
    // Also re-check when the tab regains focus: long-lived tabs are how most
    // zone changes arrive (laptop reopened after travel), with no remount.
    const syncTimeZone = () => {
      if (document.visibilityState === "hidden") {
        return;
      }

      const currentTimeZone = getBrowserTimeZone();
      const previousTimeZone = Cookies.get(TIME_ZONE_COOKIE_NAME);

      if (previousTimeZone === currentTimeZone) {
        return;
      }

      Cookies.set(TIME_ZONE_COOKIE_NAME, currentTimeZone, {
        path: "/",
        expires: 365,
        sameSite: "lax",
        domain: process.env.NEXT_PUBLIC_COOKIE_DOMAIN,
      });

      // A first visit sets the cookie without announcing a change.
      if (previousTimeZone) {
        setChange({ previousTimeZone, currentTimeZone });
      }
    };

    syncTimeZone();
    window.addEventListener("focus", syncTimeZone);
    document.addEventListener("visibilitychange", syncTimeZone);
    return () => {
      window.removeEventListener("focus", syncTimeZone);
      document.removeEventListener("visibilitychange", syncTimeZone);
    };
  }, []);

  const value = React.useMemo(
    () => (change ? { ...change, acknowledge: () => setChange(null) } : null),
    [change],
  );

  return (
    <TimeZoneChangeContext.Provider value={value}>
      {children}
    </TimeZoneChangeContext.Provider>
  );
}

/** The unacknowledged zone change for this session, if any. */
export function useTimeZoneChange() {
  return React.useContext(TimeZoneChangeContext);
}
