import dayjs from "dayjs";

/**
 * Get a range of dates in a human readable format
 * If the start and end date are the same, return the start date
 * @param start The start date
 * @param end The end date
 * @returns A human readable range of dates
 */
export function getRange(start: Date, end: Date) {
  const startDay = dayjs(start).format("DD MMM");
  const endDay = dayjs(end).format("DD MMM");
  if (startDay === endDay) {
    return startDay;
  }
  return `${startDay} - ${endDay}`;
}
