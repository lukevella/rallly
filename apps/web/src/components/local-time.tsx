"use client";

import dayjs from "dayjs";
import { useEffect, useState } from "react";

import { getBrowserTimeZone } from "@/utils/date-time-utils";

export function LocalTime({ timeZone }: { timeZone?: string }) {
  const [currentTime, setCurrentTime] = useState("");

  useEffect(() => {
    // Function to update the time
    const updateTime = () => {
      const tz = timeZone || getBrowserTimeZone();
      setCurrentTime(dayjs().tz(tz).format("LT Z"));
    };

    // Update time immediately
    updateTime();

    // Set up interval to update time every minute
    const intervalId = setInterval(updateTime, 60000); // Update every minute (60000ms)

    // Clean up interval on component unmount
    return () => clearInterval(intervalId);
  }, [timeZone]); // Re-run effect if timeZone changes

  return currentTime;
}
