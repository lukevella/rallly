import { Locale } from "date-fns";
import enGB from "date-fns/locale/en-GB";
import enUS from "date-fns/locale/en-US";
import * as React from "react";
import { useLocalStorage } from "react-use";

type TimeFormat = "12h" | "24h";
type StartOfWeek = "monday" | "sunday";

export const PreferencesContext =
  React.createContext<{
    locale: Locale;
    weekStartsOn: StartOfWeek;
    timeFormat: TimeFormat;
    setWeekStartsOn: React.Dispatch<
      React.SetStateAction<StartOfWeek | undefined>
    >;
    setTimeFormat: React.Dispatch<React.SetStateAction<TimeFormat | undefined>>;
  } | null>(null);

PreferencesContext.displayName = "PreferencesContext";

const PreferencesProvider: React.VoidFunctionComponent<{
  children?: React.ReactNode;
}> = ({ children }) => {
  const [weekStartsOn = "monday", setWeekStartsOn] =
    useLocalStorage<StartOfWeek>("rallly-week-starts-on");

  const [timeFormat = "12h", setTimeFormat] =
    useLocalStorage<TimeFormat>("rallly-time-format");

  const contextValue = React.useMemo(
    () => ({
      weekStartsOn,
      timeFormat,
      setWeekStartsOn,
      setTimeFormat,
      locale: timeFormat === "12h" ? enUS : enGB,
    }),
    [setTimeFormat, setWeekStartsOn, timeFormat, weekStartsOn],
  );

  return (
    <PreferencesContext.Provider value={contextValue}>
      {children}
    </PreferencesContext.Provider>
  );
};

export default PreferencesProvider;
