"use client";

import type { TimeFormat } from "@rallly/database";
import dayjs from "dayjs";
import advancedFormat from "dayjs/plugin/advancedFormat";
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
import * as React from "react";
import { useAsync } from "react-use";

import { usePreferences } from "@/contexts/preferences";
import { useTranslation } from "@/i18n/client";
import { getBrowserTimeZone, normalizeTimeZone } from "@/utils/date-time-utils";

import type { SupportedLocale } from "@rallly/languages";
import { useRequiredContext } from "../components/use-required-context";

const dayjsLocales: Record<
  SupportedLocale,
  {
    weekStart: number;
    timeFormat: TimeFormat;
    import: () => Promise<ILocale>;
  }
> = {
  en: {
    weekStart: 1,
    timeFormat: "hours12",
    import: () => import("dayjs/locale/en"),
  },
  "en-GB": {
    weekStart: 1,
    timeFormat: "hours24",
    import: () => import("dayjs/locale/en-gb"),
  },
  es: {
    weekStart: 1,
    timeFormat: "hours24",
    import: () => import("dayjs/locale/es"),
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
dayjs.extend(advancedFormat);

const DayjsContext = React.createContext<{
  adjustTimeZone: (
    date: dayjs.ConfigType,
    keepLocalTime: boolean,
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
    locale?: SupportedLocale;
    timeZone?: string;
    localeOverrides?: {
      weekStart?: number;
      timeFormat?: TimeFormat;
    };
  };
}> = ({ config, children }) => {
  const locale = config?.locale ?? "en";
  const state = useAsync(async () => {
    return await dayjsLocales[locale].import();
  }, [locale]);

  const preferredTimeZone = React.useMemo(
    () =>
      config?.timeZone
        ? normalizeTimeZone(config?.timeZone)
        : getBrowserTimeZone(),
    [config?.timeZone],
  );

  const adjustTimeZone = React.useCallback(
    (date: dayjs.ConfigType, localTime = false) => {
      if (!localTime) {
        return dayjs(date).tz(preferredTimeZone);
      } else {
        return dayjs(date).utc();
      }
    },
    [preferredTimeZone],
  );

  if (!state.value) {
    // wait for locale to load before rendering
    return null;
  }

  const dayjsLocale = state.value;
  const localeConfig = dayjsLocales[locale];
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

  return (
    <DayjsContext.Provider
      value={{
        adjustTimeZone,
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
  const { i18n } = useTranslation();
  return (
    <DayjsProvider
      config={{
        locale: i18n.language as SupportedLocale,
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
