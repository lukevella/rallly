import { format } from "date-fns";

export const formatDateWithoutTz = (date: Date): string => {
  return format(date, "yyyy-MM-dd'T'HH:mm:ss");
};

export const formatDateWithoutTime = (date: Date): string => {
  return format(date, "yyyy-MM-dd");
};
