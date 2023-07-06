import {
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  MoreHorizontalIcon,
  PlusIcon,
  SparklesIcon,
  XIcon,
} from "@rallly/icons";
import { Button } from "@rallly/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@rallly/ui/dropdown-menu";
import clsx from "clsx";
import dayjs from "dayjs";
import { useTranslation } from "next-i18next";
import * as React from "react";

import { Trans } from "@/components/trans";

import {
  expectTimeOption,
  getDateProps,
  removeAllOptionsForDay,
} from "../../../../utils/date-time-utils";
import CompactButton from "../../../compact-button";
import DateCard from "../../../date-card";
import { useHeadlessDatePicker } from "../../../headless-date-picker";
import Switch from "../../../switch";
import { DateTimeOption } from "..";
import { DateTimePickerProps } from "../types";
import { formatDateWithoutTime, formatDateWithoutTz } from "../utils";
import TimePicker from "./time-picker";

const MonthCalendar: React.FunctionComponent<DateTimePickerProps> = ({
  options,
  onNavigate,
  date,
  onChange,
  duration,
  onChangeDuration,
}) => {
  const { t } = useTranslation();
  const isTimedEvent = options.some((option) => option.type === "timeSlot");

  const optionsByDay = React.useMemo(() => {
    const res: Record<
      string,
      [
        {
          option: DateTimeOption;
          index: number;
        },
      ]
    > = {};

    options.forEach((option, index) => {
      const dateString =
        option.type === "date"
          ? option.date
          : option.start.substring(0, option.start.indexOf("T"));

      if (res[dateString]) {
        res[dateString].push({ option, index });
      } else {
        res[dateString] = [{ option, index }];
      }
    });

    return res;
  }, [options]);

  const datepickerSelection = React.useMemo(() => {
    return Object.keys(optionsByDay).map(
      (dateString) => new Date(dateString + "T12:00:00"),
    );
  }, [optionsByDay]);

  const datepicker = useHeadlessDatePicker({
    selection: datepickerSelection,
    onNavigationChange: onNavigate,
    date,
  });

  return (
    <div className="overflow-hidden lg:flex">
      <div className="shrink-0 border-b p-3 sm:p-4 lg:w-[440px] lg:border-b-0 lg:border-r">
        <div>
          <div className="flex w-full flex-col">
            <div className="mb-3 flex items-center justify-center space-x-4">
              <Button
                icon={ChevronLeftIcon}
                title={t("previousMonth")}
                onClick={datepicker.prev}
              />
              <div className="grow text-center text-lg font-medium">
                {datepicker.label}
              </div>
              <Button
                title={t("nextMonth")}
                icon={ChevronRightIcon}
                onClick={datepicker.next}
              />
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
            <div className="grid grow grid-cols-7 rounded-lg border bg-white shadow-sm">
              {datepicker.days.map((day, i) => {
                return (
                  <div
                    key={i}
                    className={clsx("h-12", {
                      "border-r": (i + 1) % 7 !== 0,
                      "border-b": i < datepicker.days.length - 7,
                    })}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        if (
                          datepicker.selection.some((selectedDate) =>
                            dayjs(selectedDate).isSame(day.date, "day"),
                          )
                        ) {
                          onChange(removeAllOptionsForDay(options, day.date));
                        } else {
                          const selectedDate = dayjs(day.date)
                            .set("hour", 12)
                            .toDate();
                          const newOption: DateTimeOption = !isTimedEvent
                            ? {
                                type: "date",
                                date: formatDateWithoutTime(selectedDate),
                              }
                            : {
                                type: "timeSlot",
                                start: formatDateWithoutTz(selectedDate),
                                duration,
                                end: formatDateWithoutTz(
                                  dayjs(selectedDate)
                                    .add(duration, "minutes")
                                    .toDate(),
                                ),
                              };

                          onChange([...options, newOption]);
                          onNavigate(selectedDate);
                        }
                        if (day.outOfMonth) {
                          if (i < 6) {
                            datepicker.prev();
                          } else {
                            datepicker.next();
                          }
                        }
                      }}
                      className={clsx(
                        "relative flex h-full w-full items-center justify-center text-sm hover:bg-gray-50 focus:z-10 focus:rounded active:bg-gray-100",
                        {
                          "bg-gray-50 text-gray-500": day.outOfMonth,
                          "font-bold": day.today,
                          "text-primary-600": day.today && !day.selected,
                          "font-normal text-white after:absolute after:-z-0 after:h-8 after:w-8 after:rounded-full after:bg-green-600 after:content-['']":
                            day.selected,
                        },
                      )}
                    >
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
        </div>
      </div>
      <div className="flex grow flex-col">
        <div
          className={clsx("border-b", {
            hidden: datepicker.selection.length === 0,
          })}
        >
          <div className="flex items-center space-x-3 p-3 sm:p-4">
            <div className="grow">
              <div className="font-medium">{t("specifyTimes")}</div>
              <div className="text-sm text-gray-500">
                {t("specifyTimesDescription")}
              </div>
            </div>
            <div>
              <Switch
                data-testid="specify-times-switch"
                checked={isTimedEvent}
                onChange={(checked) => {
                  if (checked) {
                    // convert dates to time slots
                    onChange(
                      options.map((option) => {
                        if (option.type === "timeSlot") {
                          throw new Error(
                            "Expected option to be a date but received timeSlot",
                          );
                        }
                        const startDate = new Date(`${option.date}T12:00:00`);
                        const endDate = dayjs(startDate)
                          .add(duration, "minutes")
                          .toDate();
                        return {
                          type: "timeSlot",
                          start: formatDateWithoutTz(startDate),
                          duration: duration,
                          end: formatDateWithoutTz(endDate),
                        };
                      }),
                    );
                  } else {
                    onChange(
                      datepicker.selection.map((date) => ({
                        type: "date",
                        date: formatDateWithoutTime(date),
                      })),
                    );
                  }
                }}
              />
            </div>
          </div>
        </div>
        <div className="max-h-[calc(100vh-400px)] min-h-0 grow overflow-auto">
          {isTimedEvent ? (
            <div className="divide-y">
              {Object.keys(optionsByDay)
                .sort((a, b) => (a > b ? 1 : -1))
                .map((dateString) => {
                  const optionsForDay = optionsByDay[dateString];
                  return (
                    <div
                      key={dateString}
                      className="space-y-3 p-3 sm:flex sm:space-x-4 sm:space-y-0 sm:p-4"
                    >
                      <div>
                        <DateCard
                          {...getDateProps(new Date(dateString + "T12:00:00"))}
                        />
                      </div>
                      <div className="grow space-y-3">
                        {optionsForDay.map(({ option, index }) => {
                          if (option.type === "date") {
                            throw new Error("Expected timeSlot but got date");
                          }
                          const startDate = new Date(option.start);
                          return (
                            <div
                              key={index}
                              className="flex items-center space-x-3"
                            >
                              <TimePicker
                                value={startDate}
                                onChange={(newStart) => {
                                  const newEnd = dayjs(newStart).add(
                                    duration,
                                    "minutes",
                                  );

                                  // replace enter with updated start time
                                  onChange([
                                    ...options.slice(0, index),
                                    {
                                      ...option,
                                      start: formatDateWithoutTz(newStart),
                                      end: formatDateWithoutTz(newEnd.toDate()),
                                    },
                                    ...options.slice(index + 1),
                                  ]);
                                  onNavigate(newStart);
                                  onChangeDuration(
                                    newEnd.diff(newStart, "minutes"),
                                  );
                                }}
                              />
                              <TimePicker
                                value={new Date(option.end)}
                                after={startDate}
                                onChange={(newEnd) => {
                                  onChange([
                                    ...options.slice(0, index),
                                    {
                                      ...option,
                                      end: formatDateWithoutTz(newEnd),
                                    },
                                    ...options.slice(index + 1),
                                  ]);
                                  onNavigate(newEnd);
                                  onChangeDuration(
                                    dayjs(newEnd).diff(startDate, "minutes"),
                                  );
                                }}
                              />
                              <CompactButton
                                icon={XIcon}
                                onClick={() => {
                                  onChange([
                                    ...options.slice(0, index),
                                    ...options.slice(index + 1),
                                  ]);
                                }}
                              />
                            </div>
                          );
                        })}
                        <div className="flex items-center space-x-3">
                          <Button
                            icon={PlusIcon}
                            onClick={() => {
                              const lastOption = expectTimeOption(
                                optionsForDay[optionsForDay.length - 1].option,
                              );

                              const startTime = dayjs(lastOption.end).isSame(
                                lastOption.start,
                                "day",
                              )
                                ? // if the end time of the previous option is on the same day as the start time, use the end time
                                  lastOption.end
                                : // otherwise use the start time
                                  lastOption.start;

                              onChange([
                                ...options,
                                {
                                  type: "timeSlot",
                                  start: startTime,
                                  duration,
                                  end: formatDateWithoutTz(
                                    dayjs(new Date(startTime))
                                      .add(duration, "minutes")
                                      .toDate(),
                                  ),
                                },
                              ]);
                            }}
                          >
                            {t("addTimeOption")}
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild={true}>
                              <button className="text-gray-500 hover:text-gray-800">
                                <MoreHorizontalIcon className="h4 w-4" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start">
                              <DropdownMenuLabel>
                                <Trans i18nKey="menu" defaults="Menu" />
                              </DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => {
                                  const times = optionsForDay.map(
                                    ({ option }) => {
                                      if (option.type === "date") {
                                        throw new Error(
                                          "Expected timeSlot but got date",
                                        );
                                      }

                                      return {
                                        startTime: option.start.substring(
                                          option.start.indexOf("T"),
                                        ),
                                        duration: option.duration,
                                        endTime: option.end.substring(
                                          option.end.indexOf("T"),
                                        ),
                                      };
                                    },
                                  );
                                  const newOptions: DateTimeOption[] = [];
                                  Object.keys(optionsByDay).forEach(
                                    (dateString) => {
                                      times.forEach((time) => {
                                        const start =
                                          dateString + time.startTime;
                                        newOptions.push({
                                          type: "timeSlot",
                                          start: start,
                                          duration,
                                          end: dayjs(start)
                                            .add(duration, "minutes")
                                            .format("YYYY-MM-DDTHH:mm"),
                                        });
                                      });
                                    },
                                  );
                                  onChange(newOptions);
                                }}
                              >
                                <SparklesIcon className="mr-2 h-4 w-4" />
                                <Trans i18nKey="applyToAllDates" />
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  onChange(
                                    removeAllOptionsForDay(
                                      options,
                                      new Date(dateString),
                                    ),
                                  );
                                }}
                              >
                                <XIcon className="mr-2 h-4 w-4" />
                                <Trans i18nKey="deleteDate" />
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          ) : datepicker.selection.length ? (
            <div className="grid grid-cols-[repeat(auto-fill,54px)] gap-3 p-3 sm:gap-4 sm:p-4">
              {datepicker.selection
                .sort((a, b) => a.getTime() - b.getTime())
                .map((selectedDate, i) => {
                  return (
                    <DateCard
                      key={i}
                      {...getDateProps(selectedDate)}
                      annotation={
                        <CompactButton
                          icon={XIcon}
                          onClick={() => {
                            // TODO (Luke Vella) [2022-03-19]: Find cleaner way to manage this state
                            // Quite tedious right now to remove a single element
                            onChange(
                              removeAllOptionsForDay(options, selectedDate),
                            );
                          }}
                        />
                      }
                    />
                  );
                })}
            </div>
          ) : (
            <div className="flex h-full items-center justify-center py-12">
              <div className="text-center font-medium text-gray-400">
                <CalendarIcon className="mb-2 inline-block h-12 w-12" />
                <div>{t("noDatesSelected")}</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MonthCalendar;
