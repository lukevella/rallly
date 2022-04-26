import {
  addDays,
  addMonths,
  format,
  getMonth,
  isSameDay,
  isWeekend,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import React from "react";

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
  const [localSelection, setSelection] = React.useState<Date[]>([]);
  const selection = options?.selection ?? localSelection;
  const [localNavigationDate, setNavigationDate] = React.useState(today);
  const navigationDate = options?.date ?? localNavigationDate;

  const firstDayOfMonth = startOfMonth(navigationDate);
  const firstDayOfFirstWeek = startOfWeek(firstDayOfMonth, {
    weekStartsOn: options?.weekStartsOn === "monday" ? 1 : 0,
  });

  const currentMonth = getMonth(navigationDate);

  const days: DayProps[] = [];

  const daysOfWeek: string[] = [];

  for (let i = 0; i < 7; i++) {
    daysOfWeek.push(format(addDays(firstDayOfFirstWeek, i), "EE"));
  }

  let reachedEnd = false;
  let i = 0;
  do {
    const d = addDays(firstDayOfFirstWeek, i);
    days.push({
      date: d,
      day: format(d, "d"),
      weekend: isWeekend(d),
      outOfMonth: getMonth(d) !== currentMonth,
      today: isSameDay(d, today),
      selected: selection.some((selectedDate) => isSameDay(selectedDate, d)),
    });
    i++;
    reachedEnd =
      i > 34 && i % 7 === 0 && addDays(d, 1).getMonth() !== currentMonth;
  } while (reachedEnd === false);

  return {
    navigationDate,
    label: format(navigationDate, "MMMM yyyy"),
    next: () => {
      const newDate = startOfMonth(addMonths(navigationDate, 1));
      if (!options?.date) {
        setNavigationDate(newDate);
      }
      options?.onNavigationChange?.(newDate);
    },
    prev: () => {
      const newDate = startOfMonth(addMonths(navigationDate, -1));
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
