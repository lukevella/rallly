import { trpc } from "@rallly/backend";
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
import { useRouter } from "next/router";
import * as React from "react";
import { useAsync } from "react-use";

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
    timeZone: string;
  };
  weekStart: number;
  timeZone: string;
  timeFormat: TimeFormat;
} | null>(null);

export const useDayjs = () => {
  return useRequiredContext(DayjsContext);
};

export const DayjsProvider: React.FunctionComponent<{
  children?: React.ReactNode;
}> = ({ children }) => {
  const router = useRouter();

  const localeConfig = dayjsLocales[router.locale ?? "en"];
  const { data } = trpc.userPreferences.get.useQuery();

  const state = useAsync(async () => {
    const locale = await localeConfig.import();
    const localeTimeFormat = localeConfig.timeFormat;
    const timeFormat = data?.timeFormat ?? localeConfig.timeFormat;
    dayjs.locale("custom", {
      ...locale,
      weekStart: data?.weekStart ?? locale.weekStart,
      formats:
        localeTimeFormat === data?.timeFormat
          ? locale.formats
          : {
              ...locale.formats,
              LT: timeFormat === "hours12" ? "h:mm A" : "HH:mm",
            },
    });
  }, [localeConfig, data]);

  const locale = {
    timeZone: getBrowserTimeZone(),
    weekStart: localeConfig.weekStart,
    timeFormat: localeConfig.timeFormat,
  };

  const preferredTimeZone = data?.timeZone ?? locale.timeZone;

  if (state.loading) {
    // wait for locale to load before rendering
    return null;
  }

  return (
    <DayjsContext.Provider
      value={{
        adjustTimeZone: (date, keepLocalTime) => {
          return keepLocalTime
            ? dayjs(date).utc()
            : dayjs(date).tz(preferredTimeZone);
        },
        dayjs,
        locale,
        timeZone: preferredTimeZone,
        weekStart: dayjs.localeData().firstDayOfWeek() === 0 ? 0 : 1,
        timeFormat: data?.timeFormat ?? localeConfig.timeFormat,
      }}
    >
      {children}
    </DayjsContext.Provider>
  );
};
