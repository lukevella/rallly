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
import updateLocale from "dayjs/plugin/updateLocale";
import utc from "dayjs/plugin/utc";
import { useParams } from "next/navigation";
import * as React from "react";
import { useAsync } from "react-use";

import { usePreferences } from "@/contexts/preferences";
import { getBrowserTimeZone } from "@/utils/date-time-utils";

import { useRequiredContext } from "../components/use-required-context";

const dayjsLocales: Record<
  string,
  {
    weekStart: number;
    timeFormat: TimeFormat;
    import: () => Promise<ILocale>;
  }
> = {
  eu: {
    weekStart: 1,
    timeFormat: "hours24",
    import: () => import("dayjs/locale/eu"),
  },
  en: {
    weekStart: 1,
    timeFormat: "hours12",
    import: () => import("dayjs/locale/en"),
  },
  es: {
    weekStart: 1,
    timeFormat: "hours24",
    import: () => import("dayjs/locale/es"),
  },
  ca: {
    weekStart: 1,
    timeFormat: "hours24",
    import: () => import("dayjs/locale/ca"),
  },
  da: {
    weekStart: 1,
    timeFormat: "hours24",
    import: () => import("dayjs/locale/da"),
  },
  de: {
    weekStart: 1,
    timeFormat: "hours24",
    import: () => import("dayjs/locale/de"),
  },
  fi: {
    weekStart: 1,
    timeFormat: "hours24",
    import: () => import("dayjs/locale/fi"),
  },
  fr: {
    weekStart: 1,
    timeFormat: "hours24",
    import: () => import("dayjs/locale/fr"),
  },
  hr: {
    weekStart: 1,
    timeFormat: "hours24",
    import: () => import("dayjs/locale/hr"),
  },
  it: {
    weekStart: 1,
    timeFormat: "hours24",
    import: () => import("dayjs/locale/it"),
  },
  sv: {
    weekStart: 1,
    timeFormat: "hours24",
    import: () => import("dayjs/locale/sv"),
  },
  sk: {
    weekStart: 1,
    timeFormat: "hours24",
    import: () => import("dayjs/locale/sk"),
  },
  cs: {
    weekStart: 1,
    timeFormat: "hours24",
    import: () => import("dayjs/locale/cs"),
  },
  pl: {
    weekStart: 1,
    timeFormat: "hours24",
    import: () => import("dayjs/locale/pl"),
  },
  pt: {
    weekStart: 1,
    timeFormat: "hours24",
    import: () => import("dayjs/locale/pt"),
  },
  "pt-BR": {
    weekStart: 0,
    timeFormat: "hours24",
    import: () => import("dayjs/locale/pt-br"),
  },
  ru: {
    weekStart: 1,
    timeFormat: "hours24",
    import: () => import("dayjs/locale/ru"),
  },
  ko: {
    weekStart: 0,
    timeFormat: "hours12",
    import: () => import("dayjs/locale/ko"),
  },
  nl: {
    weekStart: 1,
    timeFormat: "hours24",
    import: () => import("dayjs/locale/nl"),
  },
  no: {
    weekStart: 1,
    timeFormat: "hours24",
    import: () => import("dayjs/locale/nb"), // Bokmål
  },
  hu: {
    weekStart: 1,
    timeFormat: "hours24",
    import: () => import("dayjs/locale/hu"),
  },
  zh: {
    weekStart: 1,
    timeFormat: "hours24",
    import: () => import("dayjs/locale/zh"),
  },
  vi: {
    weekStart: 1,
    timeFormat: "hours24",
    import: () => import("dayjs/locale/vi"),
  },
  tr: {
    weekStart: 1,
    timeFormat: "hours24",
    import: () => import("dayjs/locale/tr"),
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
dayjs.extend(updateLocale);

const DayjsContext = React.createContext<{
  adjustTimeZone: (
    date: dayjs.ConfigType,
    keepLocalTime?: boolean,
  ) => dayjs.Dayjs;
  dayjs: (date?: dayjs.ConfigType) => dayjs.Dayjs;
  locale: {
    weekStart: number;
    timeFormat: TimeFormat;
  };
  timeZone: string;
  timeFormat: TimeFormat;
  weekStart: number;
} | null>(null);

DayjsContext.displayName = "DayjsContext";

export const useDayjs = () => {
  return useRequiredContext(DayjsContext);
};

export const DayjsProvider: React.FunctionComponent<{
  children?: React.ReactNode;
  config?: {
    locale?: string;
    timeZone?: string;
    localeOverrides?: {
      weekStart?: number;
      timeFormat?: TimeFormat;
    };
  };
}> = ({ config, children }) => {
  const locale = useParams()?.locale as string;
  const l = config?.locale ?? locale ?? "en";
  const state = useAsync(async () => {
    return await dayjsLocales[l].import();
  }, [l]);

  if (!state.value) {
    // wait for locale to load before rendering
    return null;
  }

  const dayjsLocale = state.value;
  const localeConfig = dayjsLocales[l];
  const localeTimeFormat = localeConfig.timeFormat;

  if (config?.localeOverrides) {
    const timeFormat =
      config.localeOverrides.timeFormat ?? localeConfig.timeFormat;
    const weekStart =
      config.localeOverrides.weekStart ?? localeConfig.weekStart;
    dayjs.locale("custom", {
      ...dayjsLocale,
      weekStart,
      formats:
        localeTimeFormat === config.localeOverrides?.timeFormat
          ? dayjsLocale.formats
          : {
              ...dayjsLocale.formats,
              LT: timeFormat === "hours12" ? "h:mm A" : "HH:mm",
            },
    });
  } else {
    dayjs.locale(dayjsLocale);
  }

  const preferredTimeZone = config?.timeZone ?? getBrowserTimeZone();

  return (
    <DayjsContext.Provider
      value={{
        adjustTimeZone: (date, keepLocalTime) => {
          return keepLocalTime
            ? dayjs(date).utc()
            : dayjs(date).tz(preferredTimeZone);
        },
        dayjs,
        locale: localeConfig, // locale defaults
        timeZone: preferredTimeZone,
        timeFormat:
          config?.localeOverrides?.timeFormat ?? localeConfig.timeFormat,
        weekStart: config?.localeOverrides?.weekStart ?? localeConfig.weekStart,
      }}
    >
      {children}
    </DayjsContext.Provider>
  );
};

export const ConnectedDayjsProvider = ({
  children,
}: React.PropsWithChildren) => {
  const { preferences } = usePreferences();
  return (
    <DayjsProvider
      config={{
        locale: preferences.locale ?? undefined,
        timeZone: preferences.timeZone ?? undefined,
        localeOverrides: {
          weekStart: preferences.weekStart ?? undefined,
          timeFormat: preferences.timeFormat ?? undefined,
        },
      }}
    >
      {children}
    </DayjsProvider>
  );
};
