import dayjs from "dayjs";
import de from "dayjs/locale/de";
import en from "dayjs/locale/en";
import duration from "dayjs/plugin/duration";
import isBetween from "dayjs/plugin/isBetween";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import localeData from "dayjs/plugin/localeData";
import localizedFormat from "dayjs/plugin/localizedFormat";
import minMax from "dayjs/plugin/minMax";
import relativeTime from "dayjs/plugin/relativeTime";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { useRouter } from "next/router";
import * as React from "react";
import { useLocalStorage } from "react-use";

type TimeFormat = "12h" | "24h";
type StartOfWeek = "monday" | "sunday";

const dayJsLocales = {
  de,
  en,
};

dayjs.extend(localizedFormat);
dayjs.extend(relativeTime);
dayjs.extend(localeData);
dayjs.extend(isSameOrBefore);
dayjs.extend(isBetween);
dayjs.extend(minMax);
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(duration);

export const PreferencesContext =
  React.createContext<{
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

  const router = useRouter();
  const userLocale = dayJsLocales[router.locale ?? "en"];
  const [timeFormat = "12h", setTimeFormat] =
    useLocalStorage<TimeFormat>("rallly-time-format");

  dayjs.locale({
    ...userLocale,
    weekStart: weekStartsOn === "monday" ? 1 : 0,
    formats: { LT: timeFormat === "12h" ? "h:mm A" : "HH:mm" },
  });

  const contextValue = React.useMemo(
    () => ({
      weekStartsOn,
      timeFormat,
      setWeekStartsOn,
      setTimeFormat,
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
