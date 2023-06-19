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

export const printDate = (date: Date, duration: number, timeZone?: string) => {
  if (duration === 0) {
    return dayjs(date).format("LL");
  } else if (timeZone) {
    return `${dayjs(date).tz(timeZone).format("LLL")} - ${dayjs(date)
      .add(duration, "minutes")
      .tz(timeZone)
      .format("LT")} ${getTimeZoneAbbreviation(date, timeZone)}`;
  } else {
    return `${dayjs(date).utc().format("LLL")} - ${dayjs(date)
      .utc()
      .add(duration, "minutes")
      .format("LT")}`;
  }
};
