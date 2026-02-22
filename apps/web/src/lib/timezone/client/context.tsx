"use client";

import { useUser } from "@/components/user-provider";
import { getBrowserTimeZone } from "@/utils/date-time-utils";

export const useTimezone = () => {
  const { user } = useUser();

  return {
    timezone: user?.timeZone ?? getBrowserTimeZone(),
  };
};
