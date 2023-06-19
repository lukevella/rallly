import { trpc } from "@rallly/backend";
import Cookies from "js-cookie";
import { useTranslation } from "next-i18next";

import { getBrowserTimeZone } from "@/utils/date-time-utils";
import { useDayjs } from "@/utils/dayjs";

export const useSystemPreferences = () => {
  const { i18n } = useTranslation();
  const { timeFormat: localeTimeFormat, weekStart: localeTimeFormatWeekStart } =
    useDayjs();

  return {
    language: i18n.language, // this should be the value detected in
    timeFormat: localeTimeFormat,
    weekStart: localeTimeFormatWeekStart,
    timeZone: getBrowserTimeZone(),
  } as const;
};

export const updateLanguage = (language: string) => {
  Cookies.set("NEXT_LOCALE", language, {
    expires: 30,
  });
};

export const useUserPreferences = () => {
  const { data, isFetched } = trpc.userPreferences.get.useQuery(undefined, {
    staleTime: Infinity,
    cacheTime: Infinity,
  });

  const sytemPreferences = useSystemPreferences();

  // We decide the defaults by detecting the user's preferred locale from their browser
  // by looking at the accept-language header.
  if (isFetched) {
    return {
      automatic: data === null,
      timeFormat: data?.timeFormat ?? sytemPreferences.timeFormat,
      weekStart: data?.weekStart ?? sytemPreferences.weekStart,
      timeZone: data?.timeZone ?? sytemPreferences.timeZone,
    } as const;
  }
};
