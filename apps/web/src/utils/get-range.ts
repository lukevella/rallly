import dayjs from "dayjs";

/**
 * Get a range of dates in a human readable format
 * If the start and end date are the same, return the start date
 * If either the end date is in a different year, include the year
 * @param start The start date
 * @param end The end date
 * @returns A human readable range of dates
 */
export function getRange(start: Date, end: Date) {
  const startDay = dayjs(start).format("D MMM");
  const endDay = dayjs(end).format("D MMM");
  const startYear = dayjs(start).format("YYYY");
  const endYear = dayjs(end).format("YYYY");

  if (startDay === endDay) {
    return `${startDay} ${startYear}`;
  }

  if (startYear !== endYear) {
    return `${startDay} ${startYear} - ${endDay} ${endYear}`;
  }

  return `${startDay} - ${endDay} ${startYear}`;
}
