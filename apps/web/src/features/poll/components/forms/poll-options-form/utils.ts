import { dayjs } from "@/lib/dayjs";
import type { DateTimeOption } from "./types";

/** A poll is all-day when every option is a whole-day date. */
export const isAllDay = (options: DateTimeOption[]) =>
  options.length > 0 && options.every((option) => option.type === "date");

export const formatDateWithoutTz = (date: Date): string => {
  return dayjs(date).format("YYYY-MM-DDTHH:mm:ss");
};

export const formatDateWithoutTime = (date: Date): string => {
  return dayjs(date).format("YYYY-MM-DD");
};

export const removeAllOptionsForDay = (
  options: DateTimeOption[],
  date: Date,
) => {
  return options.filter((option) => {
    return !dayjs(date).isSame(
      option.type === "date" ? option.date : option.start,
      "day",
    );
  });
};
