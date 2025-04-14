"use client";

import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { createContext, useContext, useEffect, useState } from "react";

// Initialize dayjs plugins
dayjs.extend(utc);
dayjs.extend(timezone);

// Default to browser timezone if not specified
const getBrowserTimezone = () => {
  if (typeof window !== "undefined") {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  }
  return "UTC"; // Default to UTC for server-side rendering
};

type TimezoneContextType = {
  timezone: string;
  setTimezone: (timezone: string) => void;
  formatDate: (date: string | Date | dayjs.Dayjs, format?: string) => string;
  formatTime: (date: string | Date | dayjs.Dayjs, format?: string) => string;
  formatDateTime: (
    date: string | Date | dayjs.Dayjs,
    format?: string,
  ) => string;
};

const TimezoneContext = createContext<TimezoneContextType | undefined>(
  undefined,
);

export const TimezoneProvider = ({
  initialTimezone,
  children,
}: {
  initialTimezone?: string;
  children: React.ReactNode;
}) => {
  // Initialize with browser timezone, but allow user preference to override
  const [timezone, setTimezone] = useState<string>(() => {
    if (initialTimezone) {
      return initialTimezone;
    }
    // Try to get from localStorage first (user preference)
    if (typeof window !== "undefined") {
      const savedTimezone = localStorage.getItem("userTimezone");
      if (savedTimezone) {
        return savedTimezone;
      }
    }
    return getBrowserTimezone();
  });

  // Save timezone preference to localStorage when it changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("userTimezone", timezone);
    }
  }, [timezone]);

  // Format functions that automatically use the current timezone
  const formatDate = (
    date: string | Date | dayjs.Dayjs,
    format = "YYYY-MM-DD",
  ) => {
    return dayjs(date).tz(timezone).format(format);
  };

  const formatTime = (date: string | Date | dayjs.Dayjs, format = "HH:mm") => {
    return dayjs(date).tz(timezone).format(format);
  };

  const formatDateTime = (
    date: string | Date | dayjs.Dayjs,
    format = "YYYY-MM-DD HH:mm",
  ) => {
    return dayjs(date).tz(timezone).format(format);
  };

  const value = {
    timezone,
    setTimezone,
    formatDate,
    formatTime,
    formatDateTime,
  };

  return (
    <TimezoneContext.Provider value={value}>
      {children}
    </TimezoneContext.Provider>
  );
};

export const useTimezone = () => {
  const context = useContext(TimezoneContext);
  if (context === undefined) {
    throw new Error("useTimezone must be used within a TimezoneProvider");
  }
  return context;
};
