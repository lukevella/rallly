"use client";

import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import * as React from "react";

import { getBrowserTimeZone } from "@/utils/date-time-utils";

dayjs.extend(timezone);

interface TimezoneContextProps {
  timezone: string;
  setTimezone: (timezone: string) => void;
}

const TimezoneContext = React.createContext<TimezoneContextProps | null>(null);

interface TimezoneProviderProps {
  children: React.ReactNode;
  initialTimezone?: string;
}

export const TimezoneProvider = ({
  children,
  initialTimezone,
}: TimezoneProviderProps) => {
  const [timezone, setTimezone] = React.useState(() => {
    if (initialTimezone) {
      try {
        dayjs().tz(initialTimezone);
        return initialTimezone;
      } catch (error) {
        console.warn(error);
      }
    }

    return getBrowserTimeZone();
  });

  const value = React.useMemo(() => ({ timezone, setTimezone }), [timezone]);

  return (
    <TimezoneContext.Provider value={value}>
      {children}
    </TimezoneContext.Provider>
  );
};

export const useTimezone = () => {
  const context = React.useContext(TimezoneContext);
  if (context === null) {
    throw new Error("useTimezone must be used within a TimezoneProvider");
  }
  return context;
};
