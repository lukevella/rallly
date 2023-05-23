import { trpc } from "@rallly/backend";
import React from "react";

export const useUserPreferences = () => {
  const { data } = trpc.userPreferences.get.useQuery(undefined, {
    staleTime: Infinity,
    cacheTime: Infinity,
  });

  return React.useMemo(() => {
    if (data) {
      // We decide the defaults by detecting the user's preferred locale from their browser
      // by looking at the accept-language header.
      return {
        language: "en",
        timeFormat: "hours12" as const,
        weekStart: 1,
        timeZone: "Europe/London",
      };
    }
  }, [data]);
};
