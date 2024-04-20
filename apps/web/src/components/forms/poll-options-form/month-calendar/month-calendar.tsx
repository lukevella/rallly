import { cn } from "@rallly/ui";
import { Button } from "@rallly/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@rallly/ui/dropdown-menu";
import { Icon } from "@rallly/ui/icon";
import { Switch } from "@rallly/ui/switch";
import clsx from "clsx";
import dayjs from "dayjs";
import {
  CalendarPlusIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  DeleteIcon,
  MoreHorizontalIcon,
  PlusIcon,
  SparklesIcon,
  XIcon,
} from "lucide-react";
import { useTranslation } from "next-i18next";
import * as React from "react";
import { useFormContext } from "react-hook-form";

import {
  EmptyState,
  EmptyStateDescription,
  EmptyStateIcon,
  EmptyStateTitle,
} from "@/app/components/empty-state";
import { NewEventData } from "@/components/forms";
import { Trans } from "@/components/trans";

import {
  expectTimeOption,
  getBrowserTimeZone,
  getDateProps,
  removeAllOptionsForDay,
} from "../../../../utils/date-time-utils";
import CompactButton from "../../../compact-button";
import DateCard from "../../../date-card";
import { useHeadlessDatePicker } from "../../../headless-date-picker";
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

  const form = useFormContext<NewEventData>();

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
    <div className="overflow-hidden md:flex">
      <div className="shrink-0 border-b p-3 sm:p-4 md:w-[380px] md:border-b-0 md:border-r">
        <div>
          <div className="flex w-full flex-col">
            <div className="mb-3 flex items-center justify-center space-x-4">
              <Button title={t("previousMonth")} onClick={datepicker.prev}>
                <Icon>
                  <ChevronLeftIcon />
                </Icon>
              </Button>
              <div className="grow text-center font-semibold tracking-tight">
                {datepicker.label}
              </div>
              <Button title={t("nextMonth")} onClick={datepicker.next}>
                <Icon>
                  <ChevronRightIcon />
                </Icon>
              </Button>
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
            <div className="grid grow grid-cols-7 rounded-md border bg-white shadow-sm">
              {datepicker.days.map((day, i) => {
                return (
                  <div
                    key={i}
                    className={clsx("h-11", {
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
                        "group relative flex h-full w-full items-center justify-center rounded-none px-2.5 py-1.5 text-sm font-medium tracking-tight focus:z-10 focus:rounded",
                        {
                          "bg-gray-100 text-gray-400": day.isPast,
                          "text-rose-600": day.today && !day.selected,
                          "bg-gray-50 text-gray-500":
                            day.outOfMonth && !day.isPast,
                          "text-primary": day.selected,
                        },
                      )}
                    >
                      <span
                        aria-hidden
                        className={cn(
                          "absolute inset-1 -z-0 rounded-md",
                          day.selected
                            ? "bg-primary-50"
                            : "group-hover:bg-gray-200 group-active:bg-gray-300",
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
        </div>
      </div>
      <div className="flex grow flex-col">
        <div className="flex items-center space-x-3 border-b p-3 sm:p-4">
          <div className="grow">
            <div className="text-sm font-medium">
              <Trans
                i18nKey="selectedDates"
                values={{
                  count: datepickerSelection.length,
                }}
                defaults="{count, plural, one {1 date selected} other {# dates selected}}"
              />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-x-2.5">
              <Switch
                data-testid="specify-times-switch"
                checked={isTimedEvent}
                onCheckedChange={(checked) => {
                  if (checked) {
                    form.setValue("timeZone", getBrowserTimeZone());
                    // convert dates to time slots
                    onChange(
                      options.map<DateTimeOption>((option) => {
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
                    form.setValue("timeZone", "");
                    onChange(
                      datepicker.selection.map((date) => ({
                        type: "date",
                        date: formatDateWithoutTime(date),
                      })),
                    );
                  }
                }}
              />
              <span className="text-muted-foreground text-sm">
                <Trans i18nKey="specifyTimes" />
              </span>
            </div>
          </div>
        </div>
        <div className="min-h-0 grow overflow-auto">
          {datepicker.selection.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <EmptyState>
                <EmptyStateIcon>
                  <CalendarPlusIcon />
                </EmptyStateIcon>
                <EmptyStateTitle>
                  <Trans i18nKey="noDatesSelected" />
                </EmptyStateTitle>
                <EmptyStateDescription>
                  <Trans
                    i18nKey="noDatesSelectedDescription"
                    defaults="Start by selecting dates from the calendar"
                  />
                </EmptyStateDescription>
              </EmptyState>
            </div>
          ) : isTimedEvent ? (
            <div className="divide-y">
              {Object.keys(optionsByDay)
                .sort((a, b) => (a > b ? 1 : -1))
                .map((dateString) => {
                  const optionsForDay = optionsByDay[dateString];
                  return (
                    <div
                      key={dateString}
                      className="space-y-3 p-3 sm:flex sm:items-start sm:space-x-4 sm:space-y-0 sm:p-4"
                    >
                      <DateCard
                        {...getDateProps(new Date(dateString + "T12:00:00"))}
                      />
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
                              <Button
                                variant="ghost"
                                onClick={() => {
                                  onChange([
                                    ...options.slice(0, index),
                                    ...options.slice(index + 1),
                                  ]);
                                }}
                              >
                                <Icon>
                                  <XIcon />
                                </Icon>
                              </Button>
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
                              <Button variant="ghost">
                                <Icon>
                                  <MoreHorizontalIcon />
                                </Icon>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start">
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
                                <Icon>
                                  <SparklesIcon />
                                </Icon>
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
                                <Icon>
                                  <DeleteIcon />
                                </Icon>
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
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default MonthCalendar;
