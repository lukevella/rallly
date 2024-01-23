"use client";

import { cn } from "@rallly/ui";
import { Button } from "@rallly/ui/button";
import dayjs from "dayjs";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import * as React from "react";
import { useTranslation } from "react-i18next";

interface DayProps {
  date: Date;
  day: string;
  weekend: boolean;
  outOfMonth: boolean;
  today: boolean;
  isPast: boolean;
  selected: boolean;
}

interface HeadlessDatePickerOptions {
  onSelectionChange?: (selection: Date[]) => void;
  date?: Date;
  selection?: Date[];
  onNavigationChange?: (date: Date) => void;
}

const today = new Date();

const useHeadlessDatePicker = (
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
      isPast: d.isBefore(today, "day"),
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

export type CalendarProps = {
  selected?: Date[];
  onSelectedChange?: (dates: Date[]) => void;
};

const Calendar = React.forwardRef<HTMLDivElement, CalendarProps>(
  function Calendar({ selected = [], onSelectedChange }: CalendarProps, ref) {
    const datepicker = useHeadlessDatePicker({
      selection: selected,
    });
    const { t } = useTranslation();
    return (
      <div ref={ref} className="flex w-full flex-col">
        <div className="mb-3 flex items-center justify-center space-x-4">
          <Button icon={ChevronLeftIcon} onClick={datepicker.prev} />
          <div className="grow text-center font-semibold tracking-tight">
            {datepicker.label}
          </div>
          <Button icon={ChevronRightIcon} onClick={datepicker.next} />
        </div>
        <div className="grid grid-cols-7">
          {datepicker.daysOfWeek.map((dayOfWeek) => {
            return (
              <div
                key={dayOfWeek}
                className="flex items-center justify-center pb-2 text-sm font-medium text-gray-500"
              >
                {dayOfWeek.substring(0, 2)}
              </div>
            );
          })}
        </div>
        <div className="grid grow grid-cols-7 overflow-hidden rounded-md border bg-white">
          {datepicker.days.map((day, i) => {
            return (
              <div
                key={i}
                className={cn("h-11", {
                  "border-r": (i + 1) % 7 !== 0,
                  "border-b": i < datepicker.days.length - 7,
                })}
              >
                <button
                  type="button"
                  onClick={() => {
                    const index = selected.findIndex((date) => {
                      return dayjs(date).isSame(day.date, "day");
                    });
                    // add or remove date from selection
                    if (index !== -1) {
                      const newSelection = [...selected];
                      newSelection.splice(index, 1);
                      onSelectedChange?.(newSelection);
                    } else {
                      // add date to selection and sort
                      const newSelection = [...selected, day.date].sort(
                        (a, b) => {
                          return a.getTime() - b.getTime();
                        },
                      );
                      onSelectedChange?.(newSelection);
                    }
                  }}
                  className={cn(
                    "group relative flex h-full w-full items-start justify-end rounded-none px-2.5 py-1.5 text-sm font-medium tracking-tight focus:z-10 focus:rounded",
                    {
                      "text-rose-600": day.today && !day.selected,
                      "bg-gray-50 text-gray-500": day.outOfMonth && !day.isPast,
                      "text-primary-600": day.selected,
                    },
                  )}
                >
                  <span
                    aria-hidden
                    className={cn(
                      "absolute inset-1 -z-0 rounded-md border",
                      day.selected
                        ? "border-primary-200 bg-primary-50 text-primary group-hover:bg-primary-100 shadow-sm"
                        : "border-transparent group-hover:border-gray-200 group-hover:bg-gray-50 group-active:bg-gray-200",
                    )}
                  ></span>
                  <span className="z-10">{day.day}</span>
                </button>
              </div>
            );
          })}
        </div>
        <Button className="mt-3" onClick={datepicker.today}>
          {t("today")}
        </Button>
      </div>
    );
  },
);
Calendar.displayName = "Calendar";

export { Calendar };
