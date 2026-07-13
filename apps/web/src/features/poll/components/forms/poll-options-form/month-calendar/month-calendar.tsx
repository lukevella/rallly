import { cn } from "@rallly/ui";
import { Button } from "@rallly/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@rallly/ui/dropdown-menu";
import { Icon } from "@rallly/ui/icon";
import { RadioCards, RadioCardsItem } from "@rallly/ui/radio-pills";
import {
  CalendarIcon,
  CalendarXIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  MoreVerticalIcon,
  PlusIcon,
  SparklesIcon,
  XIcon,
} from "lucide-react";
import * as React from "react";
import { useFormContext } from "react-hook-form";
import DateCard from "@/components/date-card";
import {
  EmptyState,
  EmptyStateDescription,
  EmptyStateIcon,
  EmptyStateTitle,
} from "@/components/empty-state";
import { useHeadlessDatePicker } from "@/components/headless-date-picker";
import type { NewEventData } from "@/features/poll/components/forms/types";
import { Trans, useTranslation } from "@/i18n/client";
import { useDateTime, useDateTimeConfig } from "@/lib/datetime/client";
import { formatDateParts } from "@/lib/datetime/format";
import { dayjs } from "@/lib/dayjs";
import {
  expectTimeOption,
  getBrowserTimeZone,
  removeAllOptionsForDay,
} from "@/lib/utils/date-time-utils";
import type { DateTimeOption, DateTimePickerProps } from "../types";
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
  const { locale } = useDateTimeConfig();
  const { formatDuration } = useDateTime();
  // Time-based options are the default. With no options yet the selected
  // duration drives the mode (0 = all-day) so the first selection creates the
  // right kind of option; once options exist their type is the source of truth.
  const isTimedEvent =
    options.length > 0
      ? options.some((option) => option.type === "timeSlot")
      : duration !== 0;

  const form = useFormContext<NewEventData>();

  // Durations currently in use across the timed options. When they all share a
  // single value the radio group selects it; differing values show as "Mixed".
  const optionDurations = options.flatMap((option) =>
    option.type === "timeSlot"
      ? [dayjs(option.end).diff(option.start, "minute")]
      : [],
  );
  const uniformDuration =
    optionDurations.length > 0 &&
    optionDurations.every((d) => d === optionDurations[0])
      ? optionDurations[0]
      : null;
  const isMixed = optionDurations.length > 0 && uniformDuration === null;

  const durationValue = !isTimedEvent
    ? "all-day"
    : isMixed
      ? "mixed"
      : String(uniformDuration ?? duration);

  // Standard presets, plus the current duration if it's a non-standard value
  // (e.g. set by dragging in the week view) so the selection stays visible.
  const durationPresets = [30, 60, 90, 120];
  const durationOptions =
    uniformDuration !== null && !durationPresets.includes(uniformDuration)
      ? [...durationPresets, uniformDuration].sort((a, b) => a - b)
      : durationPresets;

  // Length to use whenever we build a time slot. `duration` is 0 in all-day
  // mode; fall back to an hour so a slot is never zero-length.
  const slotDuration = duration || 60;

  const handleDurationChange = (value: string) => {
    if (value === "mixed") {
      return;
    }

    if (value === "all-day") {
      onChangeDuration(0);
      form.setValue("timeZone", "");
      onChange(
        datepicker.selection.map((date) => ({
          type: "date",
          date: formatDateWithoutTime(date),
        })),
      );
      return;
    }

    const minutes = Number(value);
    onChangeDuration(minutes);
    if (!form.getValues("timeZone")) {
      form.setValue("timeZone", getBrowserTimeZone());
    }
    // Normalize every option to a time slot of the chosen duration, keeping the
    // existing start time (defaulting all-day options to midday).
    onChange(
      options.map<DateTimeOption>((option) => {
        const startDate =
          option.type === "timeSlot"
            ? new Date(option.start)
            : new Date(`${option.date}T12:00:00`);
        return {
          type: "timeSlot",
          start: formatDateWithoutTz(startDate),
          end: formatDateWithoutTz(
            dayjs(startDate).add(minutes, "minutes").toDate(),
          ),
        };
      }),
    );
  };

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
      (dateString) => new Date(`${dateString}T12:00:00`),
    );
  }, [optionsByDay]);

  const datepicker = useHeadlessDatePicker({
    selection: datepickerSelection,
    onNavigationChange: onNavigate,
    date,
  });

  return (
    <div className="overflow-hidden">
      <div className="border-b">
        <div className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
          <div className="font-medium text-sm">
            <Trans i18nKey="durationLabel" defaults="Duration" />
          </div>
          <RadioCards
            value={durationValue}
            onValueChange={handleDurationChange}
            className="flex-wrap gap-y-2"
          >
            {durationOptions.map((minutes) => (
              <RadioCardsItem key={minutes} value={String(minutes)}>
                {formatDuration(minutes)}
              </RadioCardsItem>
            ))}
            <RadioCardsItem data-testid="all-day-option" value="all-day">
              <Trans i18nKey="allDay" defaults="All day" />
            </RadioCardsItem>
            {isMixed ? (
              <RadioCardsItem value="mixed" disabled>
                <Trans i18nKey="mixedDurations" defaults="Mixed" />
              </RadioCardsItem>
            ) : null}
          </RadioCards>
        </div>
      </div>
      <div className="md:flex">
        <div className="shrink-0 border-b p-3 sm:p-4 md:w-[380px] md:border-r md:border-b-0">
          <div>
            <div className="flex w-full flex-col">
              <div className="mb-3 flex items-center justify-center space-x-4">
                <Button
                  title={t("previousMonth")}
                  size="icon"
                  onClick={datepicker.prev}
                >
                  <ChevronLeftIcon />
                </Button>
                <div className="grow text-center font-semibold tracking-tight">
                  {datepicker.label}
                </div>
                <Button
                  title={t("nextMonth")}
                  size="icon"
                  onClick={datepicker.next}
                >
                  <ChevronRightIcon />
                </Button>
              </div>
              <div className="grid grid-cols-7">
                {datepicker.daysOfWeek.map((dayOfWeek) => {
                  return (
                    <div
                      key={dayOfWeek}
                      className="flex items-center justify-center pb-2 font-medium text-muted-foreground text-sm"
                    >
                      {dayOfWeek.substring(0, 2)}
                    </div>
                  );
                })}
              </div>
              <div className="grid grow grid-cols-7 overflow-hidden rounded-lg border shadow-xs">
                {datepicker.days.map((day, i) => {
                  return (
                    <div
                      // biome-ignore lint/suspicious/noArrayIndexKey: Fix this later
                      key={i}
                      className={cn("h-11", {
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
                                  end: formatDateWithoutTz(
                                    dayjs(selectedDate)
                                      .add(slotDuration, "minutes")
                                      .toDate(),
                                  ),
                                };

                            if (
                              options.length === 0 &&
                              newOption.type === "timeSlot" &&
                              !form.getValues("timeZone")
                            ) {
                              form.setValue("timeZone", getBrowserTimeZone());
                            }

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
                        className={cn(
                          "group relative flex h-full w-full items-start justify-end rounded-none px-2.5 py-1.5 font-medium text-sm tracking-tight focus:z-10 focus:rounded-sm",
                          {
                            "bg-muted text-muted-foreground opacity-50":
                              day.isPast,
                            "text-rose-500": day.today && !day.selected,
                            "bg-muted/50 text-muted-foreground":
                              day.outOfMonth && !day.isPast,
                            "text-foreground": day.selected,
                          },
                        )}
                      >
                        <span
                          aria-hidden
                          className={cn(
                            "absolute inset-1 z-0 rounded-md border",
                            day.selected
                              ? "border-accent-border bg-accent shadow-xs group-hover:border-accent-border"
                              : "border-transparent group-hover:border-accent-border group-active:bg-accent",
                          )}
                        />
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
          <div className="min-h-0 grow overflow-auto">
            {datepicker.selection.length === 0 ? (
              <div className="flex h-full items-center justify-center py-12">
                <EmptyState>
                  <EmptyStateIcon>
                    <CalendarIcon />
                  </EmptyStateIcon>
                  <EmptyStateTitle>
                    <Trans
                      i18nKey="noDatesSelected"
                      defaults="No dates selected"
                    />
                  </EmptyStateTitle>
                  <EmptyStateDescription>
                    <Trans
                      i18nKey="noDatesSelectedDescription"
                      defaults="Click on a date to add a time slot"
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
                    const dateParts = formatDateParts(
                      new Date(`${dateString}T12:00:00`),
                      { locale },
                    );
                    return (
                      <div
                        key={dateString}
                        className="space-y-3 p-3 sm:flex sm:items-start sm:space-x-4 sm:space-y-0 sm:p-4"
                      >
                        <DateCard day={dateParts.day} month={dateParts.month} />
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
                                      slotDuration,
                                      "minutes",
                                    );

                                    // replace enter with updated start time
                                    onChange([
                                      ...options.slice(0, index),
                                      {
                                        ...option,
                                        start: formatDateWithoutTz(newStart),
                                        end: formatDateWithoutTz(
                                          newEnd.toDate(),
                                        ),
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
                                  aria-label={t("removeTimeSlot", {
                                    defaultValue: "Remove time slot",
                                  })}
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => {
                                    onChange([
                                      ...options.slice(0, index),
                                      ...options.slice(index + 1),
                                    ]);
                                  }}
                                >
                                  <XIcon />
                                </Button>
                              </div>
                            );
                          })}
                          <div className="flex items-center space-x-2">
                            <Button
                              onClick={() => {
                                const lastOption = expectTimeOption(
                                  optionsForDay[optionsForDay.length - 1]
                                    .option,
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
                                    end: formatDateWithoutTz(
                                      dayjs(new Date(startTime))
                                        .add(slotDuration, "minutes")
                                        .toDate(),
                                    ),
                                  },
                                ]);
                              }}
                            >
                              <PlusIcon data-icon="inline-start" />
                              {t("addTimeOption")}
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger
                                render={
                                  <Button
                                    aria-label={t("moreOptions", {
                                      defaultValue: "More options",
                                    })}
                                    variant="ghost"
                                    size="icon"
                                  />
                                }
                              >
                                <MoreVerticalIcon />
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
                                            end: dayjs(start)
                                              .add(slotDuration, "minutes")
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
                                    <CalendarXIcon />
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
            ) : (
              <div className="flex flex-wrap gap-3 p-3 sm:gap-4 sm:p-4">
                {datepicker.selection
                  .sort((a, b) => a.getTime() - b.getTime())
                  .map((selectedDate, i) => {
                    const dateParts = formatDateParts(selectedDate, {
                      locale,
                    });
                    return (
                      <DateCard
                        // biome-ignore lint/suspicious/noArrayIndexKey: Fix this later
                        key={i}
                        day={dateParts.day}
                        month={dateParts.month}
                        // annotation={
                        //   <CompactButton
                        //     icon={XIcon}
                        //     onClick={() => {
                        //       // TODO (Luke Vella) [2022-03-19]: Find cleaner way to manage this state
                        //       // Quite tedious right now to remove a single element
                        //       onChange(
                        //         removeAllOptionsForDay(options, selectedDate),
                        //       );
                        //     }}
                        //   />
                        // }
                      />
                    );
                  })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MonthCalendar;
