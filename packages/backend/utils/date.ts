import dayjs from "dayjs";
import localizedFormat from "dayjs/plugin/localizedFormat";
import timezone from "dayjs/plugin/timezone";
import spacetime from "spacetime";
import soft from "timezone-soft";

dayjs.extend(localizedFormat);
dayjs.extend(timezone);

export const getTimeZoneAbbreviation = (date: Date, timeZone: string) => {
  const timeZoneDisplayFormat = soft(timeZone)[0];
  const spaceTimeDate = spacetime(date, timeZone);
  const standardAbbrev = timeZoneDisplayFormat.standard.abbr;
  const dstAbbrev = timeZoneDisplayFormat.daylight?.abbr;
  const abbrev = spaceTimeDate.isDST() ? dstAbbrev : standardAbbrev;
  return abbrev;
};
