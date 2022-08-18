import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
import isBetween from "dayjs/plugin/isBetween";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import localeData from "dayjs/plugin/localeData";
import localizedFormat from "dayjs/plugin/localizedFormat";
import minMax from "dayjs/plugin/minMax";
import relativeTime from "dayjs/plugin/relativeTime";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { useTranslation } from "next-i18next";
import * as React from "react";
import { useAsync, useLocalStorage } from "react-use";

import { useRequiredContext } from "../components/use-required-context";

export type TimeFormat = "12h" | "24h";
export type StartOfWeek = "monday" | "sunday";

const dayjsLocales: Record<
  string,
  {
    weekStartsOn: StartOfWeek;
    timeFormat: TimeFormat;
    import: () => Promise<ILocale>;
  }
> = {
  en: {
    weekStartsOn: "monday",
    timeFormat: "12h",
    import: () => import("dayjs/locale/en"),
  },
  es: {
    weekStartsOn: "monday",
    timeFormat: "24h",
    import: () => import("dayjs/locale/es"),
  },
  de: {
    weekStartsOn: "monday",
    timeFormat: "24h",
    import: () => import("dayjs/locale/de"),
  },
  fr: {
    weekStartsOn: "monday",
    timeFormat: "24h",
    import: () => import("dayjs/locale/fr"),
  },
  it: {
    weekStartsOn: "monday",
    timeFormat: "24h",
    import: () => import("dayjs/locale/it"),
  },
  sv: {
    weekStartsOn: "monday",
    timeFormat: "24h",
    import: () => import("dayjs/locale/sv"),
  },
  pt: {
    weekStartsOn: "sunday",
    timeFormat: "24h",
    import: () => import("dayjs/locale/pt"),
  },
  "pt-BR": {
    weekStartsOn: "sunday",
    timeFormat: "24h",
    import: () => import("dayjs/locale/pt-br"),
  },
  ko: {
    weekStartsOn: "sunday",
    timeFormat: "12h",
    import: () => import("dayjs/locale/ko"),
  },
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

const DayjsContext =
  React.createContext<{
    dayjs: (date?: dayjs.ConfigType) => dayjs.Dayjs;
    weekStartsOn: StartOfWeek;
    timeFormat: TimeFormat;
    setWeekStartsOn: React.Dispatch<
      React.SetStateAction<StartOfWeek | undefined>
    >;
    setTimeFormat: React.Dispatch<React.SetStateAction<TimeFormat | undefined>>;
  } | null>(null);

export const useDayjs = () => {
  return useRequiredContext(DayjsContext);
};

export const DayjsProvider: React.VoidFunctionComponent<{
  children?: React.ReactNode;
}> = ({ children }) => {
  const { i18n } = useTranslation();

  // Using language instead of router.locale because when transitioning from homepage to
  // the app via <Link locale={false}> it will be set to "en" instead of the current locale.
  const localeConfig = dayjsLocales[i18n.language];

  const [weekStartsOn = localeConfig.weekStartsOn, setWeekStartsOn] =
    useLocalStorage<StartOfWeek>("rallly-week-starts-on");

  const [timeFormat = localeConfig.timeFormat, setTimeFormat] =
    useLocalStorage<TimeFormat>("rallly-time-format");

  const { value: dayjsLocale } = useAsync(async () => {
    return await localeConfig.import();
  }, [localeConfig]);

  if (!dayjsLocale) {
    // wait for locale to load before rendering content
    return null;
  }

  dayjs.locale({
    ...dayjsLocale,
    weekStart: weekStartsOn
      ? weekStartsOn === "monday"
        ? 1
        : 0
      : dayjsLocale.weekStart,
    formats:
      localeConfig.timeFormat !== timeFormat
        ? {
            ...dayjsLocale.formats,
            LT: timeFormat === "12h" ? "h:mm A" : "HH:mm",
          }
        : dayjsLocale.formats,
  });

  return (
    <DayjsContext.Provider
      value={{
        dayjs,
        weekStartsOn: weekStartsOn ?? localeConfig.weekStartsOn,
        timeFormat: timeFormat ?? localeConfig.timeFormat,
        setWeekStartsOn,
        setTimeFormat,
      }}
    >
      {children}
    </DayjsContext.Provider>
  );
};
