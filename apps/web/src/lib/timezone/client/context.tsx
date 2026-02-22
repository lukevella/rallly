"use client";

import * as React from "react";
import { useUser } from "@/components/user-provider";
import { dayjs } from "@/lib/dayjs";
import { getBrowserTimeZone } from "@/utils/date-time-utils";

interface TimezoneContextProps {
  timezone: string;
  setTimezone: (timezone: string) => void;
}

const TimezoneContext = React.createContext<TimezoneContextProps | null>(null);

interface TimezoneProviderProps {
  children: React.ReactNode;
}

export const TimezoneProvider = ({ children }: TimezoneProviderProps) => {
  const { user } = useUser();
  const [timezone, setTimezone] = React.useState(() => {
    if (user?.timeZone) {
      try {
        dayjs().tz(user.timeZone);
        return user.timeZone;
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
