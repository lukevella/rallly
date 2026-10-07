import { dayjs } from "@/lib/dayjs";
import type { DateTimeOption } from "./types";

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
