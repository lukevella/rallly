import { TimeFormat } from "@rallly/database";
import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
import isBetween from "dayjs/plugin/isBetween";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import localeData from "dayjs/plugin/localeData";
import localizedFormat from "dayjs/plugin/localizedFormat";
import minMax from "dayjs/plugin/minMax";
import relativeTime from "dayjs/plugin/relativeTime";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { useTranslation } from "next-i18next";
import * as React from "react";
import { useAsync } from "react-use";

import { useRequiredContext } from "../components/use-required-context";

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
    timeFormat: "hours12",
    import: () => import("dayjs/locale/en"),
  },
  es: {
    weekStartsOn: "monday",
    timeFormat: "hours24",
    import: () => import("dayjs/locale/es"),
  },
  ca: {
    weekStartsOn: "monday",
    timeFormat: "hours24",
    import: () => import("dayjs/locale/ca"),
  },
  da: {
    weekStartsOn: "monday",
    timeFormat: "hours24",
    import: () => import("dayjs/locale/da"),
  },
  de: {
    weekStartsOn: "monday",
    timeFormat: "hours24",
    import: () => import("dayjs/locale/de"),
  },
  fi: {
    weekStartsOn: "monday",
    timeFormat: "hours24",
    import: () => import("dayjs/locale/fi"),
  },
  fr: {
    weekStartsOn: "monday",
    timeFormat: "hours24",
    import: () => import("dayjs/locale/fr"),
  },
  hr: {
    weekStartsOn: "monday",
    timeFormat: "hours24",
    import: () => import("dayjs/locale/hr"),
  },
  it: {
    weekStartsOn: "monday",
    timeFormat: "hours24",
    import: () => import("dayjs/locale/it"),
  },
  sv: {
    weekStartsOn: "monday",
    timeFormat: "hours24",
    import: () => import("dayjs/locale/sv"),
  },
  sk: {
    weekStartsOn: "monday",
    timeFormat: "hours24",
    import: () => import("dayjs/locale/sk"),
  },
  cs: {
    weekStartsOn: "monday",
    timeFormat: "hours24",
    import: () => import("dayjs/locale/cs"),
  },
  pl: {
    weekStartsOn: "monday",
    timeFormat: "hours24",
    import: () => import("dayjs/locale/pl"),
  },
  pt: {
    weekStartsOn: "monday",
    timeFormat: "hours24",
    import: () => import("dayjs/locale/pt"),
  },
  "pt-BR": {
    weekStartsOn: "sunday",
    timeFormat: "hours24",
    import: () => import("dayjs/locale/pt-br"),
  },
  ru: {
    weekStartsOn: "monday",
    timeFormat: "hours24",
    import: () => import("dayjs/locale/ru"),
  },
  ko: {
    weekStartsOn: "sunday",
    timeFormat: "hours12",
    import: () => import("dayjs/locale/ko"),
  },
  nl: {
    weekStartsOn: "monday",
    timeFormat: "hours24",
    import: () => import("dayjs/locale/nl"),
  },
  hu: {
    weekStartsOn: "monday",
    timeFormat: "hours24",
    import: () => import("dayjs/locale/hu"),
  },
  zh: {
    weekStartsOn: "monday",
    timeFormat: "hours24",
    import: () => import("dayjs/locale/zh"),
  },
  vi: {
    weekStartsOn: "monday",
    timeFormat: "hours24",
    import: () => import("dayjs/locale/vi"),
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
dayjs.extend(isSameOrAfter);

const DayjsContext = React.createContext<{
  dayjs: (date?: dayjs.ConfigType) => dayjs.Dayjs;
  weekStartsOn: StartOfWeek;
  timeFormat: TimeFormat;
} | null>(null);

export const useDayjs = () => {
  return useRequiredContext(DayjsContext);
};

const DayjsProviderInner: React.FunctionComponent<{
  children?: React.ReactNode;
}> = ({ children }) => {
  const { i18n } = useTranslation();

  // Using language instead of router.locale because when transitioning from homepage to
  // the app via <Link locale={false}> it will be set to "en" instead of the current locale.
  const localeConfig = dayjsLocales[i18n.language];

  const { value: dayjsLocale } = useAsync(async () => {
    return await localeConfig.import();
  }, [localeConfig]);

  if (!dayjsLocale) {
    // wait for locale to load before rendering content
    return null;
  }

  dayjs.locale(dayjsLocale);

  return (
    <DayjsContext.Provider
      value={{
        dayjs,
        weekStartsOn: localeConfig.weekStartsOn,
        timeFormat: localeConfig.timeFormat,
      }}
    >
      {children}
    </DayjsContext.Provider>
  );
};

export const DayjsProvider: React.FunctionComponent<{
  children?: React.ReactNode;
}> = ({ children }) => {
  return <DayjsProviderInner>{children}</DayjsProviderInner>;
};
