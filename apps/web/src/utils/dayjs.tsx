"use client";

import type { TimeFormat } from "@rallly/database";
import type { SupportedLocale } from "@rallly/languages";
import dayjsLocaleCs from "dayjs/locale/cs";
import dayjsLocaleDa from "dayjs/locale/da";
import dayjsLocaleDe from "dayjs/locale/de";
import dayjsLocaleEn from "dayjs/locale/en";
import dayjsLocaleEnGb from "dayjs/locale/en-gb";
import dayjsLocaleEs from "dayjs/locale/es";
import dayjsLocaleFi from "dayjs/locale/fi";
import dayjsLocaleFr from "dayjs/locale/fr";
import dayjsLocaleHu from "dayjs/locale/hu";
import dayjsLocaleIt from "dayjs/locale/it";
import dayjsLocaleNb from "dayjs/locale/nb";
import dayjsLocaleNl from "dayjs/locale/nl";
import dayjsLocalePl from "dayjs/locale/pl";
import dayjsLocalePt from "dayjs/locale/pt";
import dayjsLocalePtBr from "dayjs/locale/pt-br";
import dayjsLocaleRu from "dayjs/locale/ru";
import dayjsLocaleSv from "dayjs/locale/sv";
import dayjsLocaleZh from "dayjs/locale/zh";
import * as React from "react";
import { usePreferences } from "@/contexts/preferences";
import { useTranslation } from "@/i18n/client";
import { dayjs } from "@/lib/dayjs";
import { getBrowserTimeZone, normalizeTimeZone } from "@/utils/date-time-utils";
import { useRequiredContext } from "../components/use-required-context";

const dayjsLocales: Record<
  SupportedLocale,
  {
    weekStart: number;
    timeFormat: TimeFormat;
    locale: ILocale;
  }
> = {
  en: {
    weekStart: 1,
    timeFormat: "hours12",
    locale: dayjsLocaleEn,
  },
  "en-GB": {
    weekStart: 1,
    timeFormat: "hours24",
    locale: dayjsLocaleEnGb,
  },
  es: {
    weekStart: 1,
    timeFormat: "hours24",
    locale: dayjsLocaleEs,
  },
  da: {
    weekStart: 1,
    timeFormat: "hours24",
    locale: dayjsLocaleDa,
  },
  de: {
    weekStart: 1,
    timeFormat: "hours24",
    locale: dayjsLocaleDe,
  },
  fi: {
    weekStart: 1,
    timeFormat: "hours24",
    locale: dayjsLocaleFi,
  },
  fr: {
    weekStart: 1,
    timeFormat: "hours24",
    locale: dayjsLocaleFr,
  },
  it: {
    weekStart: 1,
    timeFormat: "hours24",
    locale: dayjsLocaleIt,
  },
  sv: {
    weekStart: 1,
    timeFormat: "hours24",
    locale: dayjsLocaleSv,
  },
  cs: {
    weekStart: 1,
    timeFormat: "hours24",
    locale: dayjsLocaleCs,
  },
  pl: {
    weekStart: 1,
    timeFormat: "hours24",
    locale: dayjsLocalePl,
  },
  pt: {
    weekStart: 1,
    timeFormat: "hours24",
    locale: dayjsLocalePt,
  },
  "pt-BR": {
    weekStart: 0,
    timeFormat: "hours24",
    locale: dayjsLocalePtBr,
  },
  ru: {
    weekStart: 1,
    timeFormat: "hours24",
    locale: dayjsLocaleRu,
  },
  nl: {
    weekStart: 1,
    timeFormat: "hours24",
    locale: dayjsLocaleNl,
  },
  no: {
    weekStart: 1,
    timeFormat: "hours24",
    locale: dayjsLocaleNb, // Bokmål
  },
  hu: {
    weekStart: 1,
    timeFormat: "hours24",
    locale: dayjsLocaleHu,
  },
  zh: {
    weekStart: 1,
    timeFormat: "hours24",
    locale: dayjsLocaleZh,
  },
};

const DayjsContext = React.createContext<{
  adjustTimeZone: (
    date: dayjs.ConfigType,
    keepLocalTime: boolean,
  ) => dayjs.Dayjs;
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
  const localeConfig = dayjsLocales[locale];
  const dayjsLocale = localeConfig.locale;

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
