import { cn } from "@rallly/ui";
import { Button } from "@rallly/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@rallly/ui/dropdown-menu";
import { Input } from "@rallly/ui/input";
import { RadioCards, RadioCardsItem } from "@rallly/ui/radio-pills";
import {
  CalendarIcon,
  CalendarXIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  MoreVerticalIcon,
  PlusIcon,
  SparklesIcon,
  UsersIcon,
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
import { isPollFormOptionPast } from "@/features/poll/utils";
import { useUser } from "@/features/user/client";
import { Trans, useTranslation } from "@/i18n/client";
import { useDateTimeConfig } from "@/lib/datetime/client";
import { Duration } from "@/lib/datetime/duration";
import { formatDateParts } from "@/lib/datetime/format";
import { useCurrentTime } from "@/lib/datetime/use-current-time";
import {
  addMinutesToWallTime,
  wallTimeDiffInMinutes,
} from "@/lib/datetime/wall-time";
import { dayjs } from "@/lib/dayjs";
import {
  expectTimeOption,
  getBrowserTimeZone,
} from "@/lib/utils/date-time-utils";
import type { DateTimeOption, DateTimePickerProps } from "../types";
import {
  formatDateWithoutTime,
  getNextAvailableTimeSlotStart,
  removeAllOptionsForDay,
} from "../utils";
import TimePicker from "./time-picker";

/**
 * Numeric input for an option's max "yes" votes. An empty field means no limit
 * (`undefined`); out-of-range or non-integer input is ignored so the value
 * stays a positive 32-bit integer.
 */
function OptionParticipantLimit({
  value,
  onChange,
}: {
  value: number | undefined;
  onChange: (value: number | undefined) => void;
}) {
  const { t } = useTranslation();
  const inputId = React.useId();

  return (
    <div className="flex flex-row items-center space-x-3">
      <UsersIcon size={24} />
      <Input
        id={inputId}
        aria-label={t("optionParticipantLimitLabel", {
          defaultValue: "Maximum participants for this option",
        })}
        type="number"
        min={1}
        max={2_147_483_647}
        step={1}
        value={value ?? ""}
        onChange={(event) => {
          const next = event.currentTarget.value;
          if (next === "") {
            onChange(undefined);
            return;
          }
          const parsed = Number(next);
          if (
            Number.isSafeInteger(parsed) &&
            parsed > 0 &&
            parsed <= 2_147_483_647
          ) {
            onChange(parsed);
          }
        }}
      />
    </div>
  );
}

// Options are floating wall-clock strings, so times are computed on the
// strings themselves and never pass through the browser's zone.
const middayOf = (date: string) => `${date}T12:00:00`;

/** Local noon of the option's calendar date, for navigating the date picker. */
const navigationDateOf = (wallTime: string) =>
  new Date(middayOf(wallTime.slice(0, 10)));

const MonthCalendar: React.FunctionComponent<DateTimePickerProps> = ({
  options,
  onNavigate,
  date,
  onChange,
  duration,
  onChangeDuration,
  timeZone: pollTimeZone,
}) => {
  const { t } = useTranslation();
  const { locale } = useDateTimeConfig();
  const { user } = useUser();
  const defaultTimeZone = user?.timeZone || getBrowserTimeZone();
  const now = useCurrentTime();
  // Time-based options are the default. With no options yet the selected
  // duration drives the mode (0 = all-day) so the first selection creates the
  // right kind of option; once options exist their type is the source of truth.
  const isTimedEvent =
    options.length > 0
      ? options.some((option) => option.type === "timeSlot")
      : duration !== 0;

  const form = useFormContext<NewEventData>();
  const timeZone =
    isTimedEvent && form.watch("lockTimeZone")
      ? "UTC"
      : pollTimeZone || defaultTimeZone;

  const getDayOption = (day: Date, checkedAt = now): DateTimeOption | null => {
    const date = formatDateWithoutTime(day);
    if (!isTimedEvent) {
      const option: DateTimeOption = { type: "date", date };
      return checkedAt !== null &&
        isPollFormOptionPast({ option, now: checkedAt, timeZone })
        ? null
        : option;
    }

    let start = middayOf(date);
    if (
      checkedAt !== null &&
      isPollFormOptionPast({
        option: {
          type: "timeSlot",
          start,
          end: addMinutesToWallTime(start, slotDuration),
        },
        now: checkedAt,
        timeZone,
      })
    ) {
      const nextStart = getNextAvailableTimeSlotStart({
        date,
        now: checkedAt,
        timeZone,
      });
      if (!nextStart) {
        return null;
      }
      start = nextStart;
    }

    const option: DateTimeOption = {
      type: "timeSlot",
      start,
      end: addMinutesToWallTime(start, slotDuration),
    };
    return checkedAt !== null &&
      isPollFormOptionPast({ option, now: checkedAt, timeZone })
      ? null
      : option;
  };

  // Durations currently in use across the timed options. When they all share a
  // single value the radio group selects it; differing values show as "Mixed".
  const optionDurations = options.flatMap((option) =>
    option.type === "timeSlot"
      ? [wallTimeDiffInMinutes(option.start, option.end)]
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
        datepicker.selection.map((date) => {
          const dateValue = formatDateWithoutTime(date);
          // Collapsing a day's slots into one all-day option keeps the limit
          // only when every slot that day agrees on it.
          const dayLimits = new Set(
            options
              .filter(
                (option) =>
                  (option.type === "date"
                    ? option.date
                    : option.start.substring(0, 10)) === dateValue,
              )
              .map((option) => option.maxParticipants),
          );
          return {
            type: "date" as const,
            date: dateValue,
            maxParticipants:
              dayLimits.size === 1
                ? dayLimits.values().next().value
                : undefined,
          };
        }),
      );
      return;
    }

    const minutes = Number(value);
    onChangeDuration(minutes);
    if (!form.getValues("timeZone")) {
      form.setValue("timeZone", defaultTimeZone);
    }
    // Normalize every option to a time slot of the chosen duration, keeping the
    // existing start time (defaulting all-day options to midday).
    onChange(
      options.map<DateTimeOption>((option) => {
        const start =
          option.type === "timeSlot" ? option.start : middayOf(option.date);
        return {
          type: "timeSlot",
          start,
          end: addMinutesToWallTime(start, minutes),
          id: option.id,
          maxParticipants: option.maxParticipants,
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
                <Duration minutes={minutes} />
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
                  title={t("previousMonth", { defaultValue: "Previous month" })}
                  size="icon"
                  onClick={datepicker.prev}
                >
                  <ChevronLeftIcon />
                </Button>
                <div className="grow text-center font-semibold tracking-tight">
                  {datepicker.label}
                </div>
                <Button
                  title={t("nextMonth", { defaultValue: "Next month" })}
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
                  const isPast = getDayOption(day.date) === null;
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
                        disabled={isPast && !day.selected}
                        onClick={() => {
                          if (
                            datepicker.selection.some((selectedDate) =>
                              dayjs(selectedDate).isSame(day.date, "day"),
                            )
                          ) {
                            onChange(removeAllOptionsForDay(options, day.date));
                          } else {
                            const newOption = getDayOption(
                              day.date,
                              new Date(),
                            );
                            if (!newOption) {
                              return;
                            }
                            const selectedDate =
                              newOption.type === "timeSlot"
                                ? navigationDateOf(newOption.start)
                                : navigationDateOf(
                                    `${newOption.date}T12:00:00`,
                                  );

                            if (
                              options.length === 0 &&
                              newOption.type === "timeSlot" &&
                              !form.getValues("timeZone")
                            ) {
                              form.setValue("timeZone", defaultTimeZone);
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
                            "bg-muted text-muted-foreground opacity-50": isPast,
                            "text-rose-500": day.today && !day.selected,
                            "bg-muted/50 text-muted-foreground":
                              day.outOfMonth && !isPast,
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
                {t("today", { defaultValue: "Today" })}
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
                            const isPast =
                              now !== null &&
                              isPollFormOptionPast({
                                option,
                                now,
                                timeZone,
                              });
                            return (
                              <div
                                key={index}
                                className={`flex items-center space-x-3 ${
                                  isPast
                                    ? "rounded-lg border-red-300 bg-red-500/10 p-2 text-red-700!"
                                    : ""
                                }`}
                              >
                                <TimePicker
                                  value={option.start}
                                  timeZone={timeZone}
                                  onChange={(newStart) => {
                                    // replace enter with updated start time
                                    onChange([
                                      ...options.slice(0, index),
                                      {
                                        ...option,
                                        start: newStart,
                                        end: addMinutesToWallTime(
                                          newStart,
                                          slotDuration,
                                        ),
                                      },
                                      ...options.slice(index + 1),
                                    ]);
                                    onNavigate(navigationDateOf(newStart));
                                    onChangeDuration(slotDuration);
                                  }}
                                />
                                <TimePicker
                                  value={option.end}
                                  after={option.start}
                                  timeZone={timeZone}
                                  onChange={(newEnd) => {
                                    onChange([
                                      ...options.slice(0, index),
                                      {
                                        ...option,
                                        end: newEnd,
                                      },
                                      ...options.slice(index + 1),
                                    ]);
                                    onNavigate(navigationDateOf(newEnd));
                                    onChangeDuration(
                                      wallTimeDiffInMinutes(
                                        option.start,
                                        newEnd,
                                      ),
                                    );
                                  }}
                                />

                                <OptionParticipantLimit
                                  value={option.maxParticipants}
                                  onChange={(maxParticipants) =>
                                    onChange(
                                      options.map((o, i) =>
                                        i === index
                                          ? { ...o, maxParticipants }
                                          : o,
                                      ),
                                    )
                                  }
                                />

                                <Button
                                  aria-label={t("removeTimeSlot", {
                                    defaultValue: "Remove time slot",
                                  })}
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => {
                                    onChange(
                                      options.filter((_, i) => i !== index),
                                    );
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

                                const startTime =
                                  lastOption.end.slice(0, 10) ===
                                  lastOption.start.slice(0, 10)
                                    ? // if the end time of the previous option is on the same day as the start time, use the end time
                                      lastOption.end
                                    : // otherwise use the start time
                                      lastOption.start;

                                onChange([
                                  ...options,
                                  {
                                    type: "timeSlot",
                                    start: startTime,
                                    end: addMinutesToWallTime(
                                      startTime,
                                      slotDuration,
                                    ),
                                  },
                                ]);
                              }}
                            >
                              <PlusIcon data-icon="inline-start" />
                              {t("addTimeOption", {
                                defaultValue: "Add time option",
                              })}
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
                                        const timeOption =
                                          expectTimeOption(option);
                                        return {
                                          startTime: timeOption.start.substring(
                                            timeOption.start.indexOf("T"),
                                          ),
                                          maxParticipants:
                                            timeOption.maxParticipants,
                                        };
                                      },
                                    );
                                    const newOptions: DateTimeOption[] = [];
                                    Object.keys(optionsByDay).forEach(
                                      (dateString) => {
                                        times.forEach((time) => {
                                          const start =
                                            dateString + time.startTime;
                                          const end = dayjs(start)
                                            .add(slotDuration, "minutes")
                                            .format("YYYY-MM-DDTHH:mm");
                                          // Carry the stored id of any option
                                          // that already exists at this
                                          // date/time so a capacity edit after
                                          // "Apply to all dates" still targets
                                          // the right row; combos new to a day
                                          // get no id.
                                          const existing = options.find(
                                            (option) =>
                                              option.type === "timeSlot" &&
                                              option.start === start &&
                                              option.end === end,
                                          );
                                          newOptions.push({
                                            type: "timeSlot",
                                            id: existing?.id,
                                            start: start,
                                            end: addMinutesToWallTime(
                                              start,
                                              slotDuration,
                                            ),
                                            maxParticipants:
                                              time.maxParticipants,
                                          });
                                        });
                                      },
                                    );
                                    onChange(newOptions);
                                  }}
                                >
                                  <SparklesIcon />
                                  <Trans
                                    i18nKey="applyToAllDates"
                                    defaults="Apply to all dates"
                                  />
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
                                  <CalendarXIcon />
                                  <Trans
                                    i18nKey="deleteDate"
                                    defaults="Delete date"
                                  />
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
                    const optionIndex = options.findIndex(
                      (option) =>
                        option.type === "date" &&
                        option.date === formatDateWithoutTime(selectedDate),
                    );
                    const option = options[optionIndex];
                    if (!option || option.type !== "date") {
                      return null;
                    }
                    return (
                      <div
                        // biome-ignore lint/suspicious/noArrayIndexKey: Fix this later
                        key={i}
                        className="flex items-center gap-2"
                      >
                        <DateCard day={dateParts.day} month={dateParts.month} />
                        <OptionParticipantLimit
                          value={option.maxParticipants}
                          onChange={(maxParticipants) =>
                            onChange(
                              options.map((o, i) =>
                                i === optionIndex
                                  ? { ...o, maxParticipants }
                                  : o,
                              ),
                            )
                          }
                        />
                      </div>
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
