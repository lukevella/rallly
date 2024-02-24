import { parseIanaTimezone } from "@/utils/date-time-utils";
import { supportedTimeZones } from "@/utils/supported-time-zones";

export const groupedTimeZones = supportedTimeZones.reduce(
  (acc, tz) => {
    const { region, city } = parseIanaTimezone(tz);
    if (!acc[region]) {
      acc[region] = [];
    }
    acc[region].push({ timezone: tz, city });
    return acc;
  },
  {} as Record<string, { timezone: string; city: string }[]>,
);
