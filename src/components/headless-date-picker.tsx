import React from "react";

import { useDayjs } from "../utils/dayjs";

interface DayProps {
  date: Date;
  day: string;
  weekend: boolean;
  outOfMonth: boolean;
  today: boolean;
  selected: boolean;
}

interface HeadlessDatePickerOptions {
  onSelectionChange?: (selection: Date[]) => void;
  date?: Date;
  selection?: Date[];
  onNavigationChange?: (date: Date) => void;
  weekStartsOn?: "monday" | "sunday";
}

const today = new Date();

export const useHeadlessDatePicker = (
  options?: HeadlessDatePickerOptions,
): {
  label: string;
  next: () => void;
  prev: () => void;
  today: () => void;
  daysOfWeek: string[];
  days: DayProps[];
  navigationDate: Date;
  selection: Date[];
  toggle: (date: Date) => void;
} => {
  const { dayjs } = useDayjs();
  const [localSelection, setSelection] = React.useState<Date[]>([]);
  const selection = options?.selection ?? localSelection;
  const [localNavigationDate, setNavigationDate] = React.useState(today);
  const navigationDate = dayjs(options?.date ?? localNavigationDate);

  const firstDayOfMonth = navigationDate.startOf("month");
  const firstDayOfFirstWeek = firstDayOfMonth.startOf("week");

  const currentMonth = navigationDate.get("month");

  const days: DayProps[] = [];

  const daysOfWeek: string[] = [];

  for (let i = 0; i < 7; i++) {
    daysOfWeek.push(firstDayOfFirstWeek.add(i, "days").format("dd"));
  }

  let reachedEnd = false;
  let i = 0;
  do {
    const d = firstDayOfFirstWeek.add(i, "days");
    days.push({
      date: d.toDate(),
      day: d.format("D"),
      weekend: d.day() === 0 || d.day() === 6,
      outOfMonth: d.month() !== currentMonth,
      today: d.isSame(today, "day"),
      selected: selection.some((selectedDate) => d.isSame(selectedDate, "day")),
    });
    i++;
    reachedEnd =
      i > 34 && i % 7 === 0 && d.add(1, "day").month() !== currentMonth;
  } while (reachedEnd === false);

  return {
    navigationDate: navigationDate.toDate(),
    label: navigationDate.format("MMMM YYYY"),
    next: () => {
      const newDate = navigationDate.add(1, "month").startOf("month").toDate();
      if (!options?.date) {
        setNavigationDate(newDate);
      }
      options?.onNavigationChange?.(newDate);
    },
    prev: () => {
      const newDate = navigationDate.add(-1, "month").startOf("month").toDate();
      if (!options?.date) {
        setNavigationDate(newDate);
      }
      options?.onNavigationChange?.(newDate);
    },
    today: () => {
      const newDate = today;
      if (!options?.date) {
        setNavigationDate(newDate);
      }
      options?.onNavigationChange?.(newDate);
    },
    days,
    daysOfWeek,
    selection: options?.selection ?? selection,
    toggle: (date) => {
      if (options?.selection) {
        // ignore, selection is controlled externally
        return;
      }
      const index = selection.indexOf(date);
      if (index === -1) {
        setSelection((s) => [...s, date]);
      } else {
        setSelection((s) => s.splice(index, 1));
      }
    },
  };
};
