import clsx from "clsx";
import dayjs from "dayjs";
import { useTranslation } from "next-i18next";
import { usePlausible } from "next-plausible";
import * as React from "react";

import { usePreferences } from "@/components/preferences/use-preferences";

import {
  expectTimeOption,
  getDateProps,
  removeAllOptionsForDay,
} from "../../../../utils/date-time-utils";
import { Button } from "../../../button";
import CompactButton from "../../../compact-button";
import DateCard from "../../../date-card";
import Dropdown, { DropdownItem } from "../../../dropdown";
import { useHeadlessDatePicker } from "../../../headless-date-picker";
import Calendar from "../../../icons/calendar.svg";
import ChevronLeft from "../../../icons/chevron-left.svg";
import ChevronRight from "../../../icons/chevron-right.svg";
import DotsHorizontal from "../../../icons/dots-horizontal.svg";
import Magic from "../../../icons/magic.svg";
import PlusSm from "../../../icons/plus-sm.svg";
import Trash from "../../../icons/trash.svg";
import X from "../../../icons/x.svg";
import Switch from "../../../switch";
import { DateTimeOption } from "..";
import { DateTimePickerProps } from "../types";
import { formatDateWithoutTime, formatDateWithoutTz } from "../utils";
import TimePicker from "./time-picker";

const MonthCalendar: React.VoidFunctionComponent<DateTimePickerProps> = ({
  options,
  onNavigate,
  date,
  onChange,
  duration,
  onChangeDuration,
}) => {
  const { t } = useTranslation("app");
  const isTimedEvent = options.some((option) => option.type === "timeSlot");

  const plausible = usePlausible();

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

  const { weekStartsOn } = usePreferences();

  const datepicker = useHeadlessDatePicker({
    selection: datepickerSelection,
    onNavigationChange: onNavigate,
    weekStartsOn,
    date,
  });

  return (
    <div className="overflow-hidden lg:flex">
      <div className="border-b p-4 lg:w-[440px] lg:border-r lg:border-b-0">
        <div>
          <div className="flex w-full flex-col">
            <div className="mb-3 flex items-center justify-center space-x-4">
              <Button
                icon={<ChevronLeft />}
                title={t("previousMonth")}
                onClick={datepicker.prev}
              />
              <div className="grow text-center text-lg font-medium">
                {datepicker.label}
              </div>
              <Button
                title={t("nextMonth")}
                icon={<ChevronRight />}
                onClick={datepicker.next}
              />
            </div>
            <div className="grid grid-cols-7">
              {datepicker.daysOfWeek.map((dayOfWeek) => {
                return (
                  <div
                    key={dayOfWeek}
                    className="flex items-center justify-center pb-2 text-sm font-medium text-slate-400"
                  >
                    {dayOfWeek.substring(0, 2)}
                  </div>
                );
              })}
            </div>
            <div className="grid grow grid-cols-7 overflow-hidden rounded-lg border bg-white shadow-sm">
              {datepicker.days.map((day, i) => {
                return (
                  <button
                    type="button"
                    key={i}
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
                      "relative flex h-12 items-center justify-center text-sm hover:bg-slate-50 focus:ring-0 focus:ring-offset-0 active:bg-slate-100",
                      {
                        "bg-slate-50 text-slate-400": day.outOfMonth,
                        "font-bold": day.today,
                        "text-primary-500": day.today && !day.selected,
                        "border-r": (i + 1) % 7 !== 0,
                        "border-b": i < datepicker.days.length - 7,
                        "font-normal text-white after:absolute after:-z-0 after:h-8 after:w-8 after:animate-popIn after:rounded-full after:bg-green-500 after:content-['']":
                          day.selected,
                      },
                    )}
                  >
                    <span className="z-10">{day.day}</span>
                  </button>
                );
              })}
            </div>
            <Button className="mt-3" onClick={datepicker.today}>
              Today
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
          <div className="flex items-center space-x-3 p-4">
            <div className="grow">
              <div className="font-medium">{t("specifyTimes")}</div>
              <div className="text-sm text-slate-400">
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
        <div className="grow px-4">
          {isTimedEvent ? (
            <div className="divide-y">
              {Object.keys(optionsByDay)
                .sort((a, b) => (a > b ? 1 : -1))
                .map((dateString) => {
                  const optionsForDay = optionsByDay[dateString];
                  return (
                    <div
                      key={dateString}
                      className="space-y-3 py-4 sm:flex sm:space-y-0 sm:space-x-4"
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
                                  const newEnd = dayjs(newStart)
                                    .add(duration, "minutes")
                                    .toDate();
                                  // replace enter with updated start time
                                  onChange([
                                    ...options.slice(0, index),
                                    {
                                      ...option,
                                      start: formatDateWithoutTz(newStart),
                                      end: formatDateWithoutTz(newEnd),
                                    },
                                    ...options.slice(index + 1),
                                  ]);
                                  onNavigate(newStart);
                                  onChangeDuration(
                                    dayjs(newEnd).diff(newStart, "minutes"),
                                  );
                                }}
                              />
                              <TimePicker
                                value={new Date(option.end)}
                                startFrom={dayjs(startDate)
                                  .add(15, "minutes")
                                  .toDate()}
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
                                icon={X}
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
                            icon={<PlusSm />}
                            onClick={() => {
                              const lastOption = expectTimeOption(
                                optionsForDay[optionsForDay.length - 1].option,
                              );
                              const startTime = lastOption.start;

                              onChange([
                                ...options,
                                {
                                  type: "timeSlot",
                                  start: startTime,
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
                          <Dropdown
                            trigger={<CompactButton icon={DotsHorizontal} />}
                            placement="bottom-start"
                          >
                            <DropdownItem
                              icon={Magic}
                              disabled={datepicker.selection.length < 2}
                              label={t("applyToAllDates")}
                              onClick={() => {
                                plausible("Applied options to all dates");
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
                                      newOptions.push({
                                        type: "timeSlot",
                                        start: dateString + time.startTime,
                                        end: dateString + time.endTime,
                                      });
                                    });
                                  },
                                );
                                onChange(newOptions);
                              }}
                            />
                            <DropdownItem
                              label={t("deleteDate")}
                              icon={Trash}
                              onClick={() => {
                                onChange(
                                  removeAllOptionsForDay(
                                    options,
                                    new Date(dateString),
                                  ),
                                );
                              }}
                            />
                          </Dropdown>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          ) : datepicker.selection.length ? (
            <div className="grid grid-cols-[repeat(auto-fill,60px)] gap-5 py-4">
              {datepicker.selection
                .sort((a, b) => a.getTime() - b.getTime())
                .map((selectedDate, i) => {
                  return (
                    <DateCard
                      key={i}
                      {...getDateProps(selectedDate)}
                      annotation={
                        <CompactButton
                          icon={X}
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
                <Calendar className="mb-2 inline-block h-12 w-12" />
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
