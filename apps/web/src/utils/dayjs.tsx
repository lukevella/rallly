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
dayjs.extend(updateLocale);

const DayjsContext = React.createContext<{
  dayjs: (date?: dayjs.ConfigType) => dayjs.Dayjs;
  weekStartsOn: StartOfWeek;
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

  useAsync(async () => {
    const locale = await localeConfig.import();
    const localeTimeFormat = localeConfig.timeFormat;

    dayjs.locale("custom", {
      ...locale,
      weekStart: data?.weekStart ?? locale.weekStart,
      formats:
        localeTimeFormat === data?.timeFormat
          ? locale.formats
          : {
              ...locale.formats,
              LT: data?.timeFormat === "hours12" ? "h:mm A" : "HH:mm",
            },
    });
  }, [localeConfig, data]);

  return (
    <DayjsContext.Provider
      value={{
        dayjs,
        weekStartsOn:
          dayjs.localeData().firstDayOfWeek() === 0 ? "sunday" : "monday",
        timeFormat: data?.timeFormat ?? localeConfig.timeFormat,
      }}
    >
      {children}
    </DayjsContext.Provider>
  );
};
