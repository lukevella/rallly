import clsx from "clsx";
import dayjs from "dayjs";
import React from "react";
import { Calendar } from "react-big-calendar";
import { useMount } from "react-use";

import { getDuration } from "../../../utils/date-time-utils";
import DateNavigationToolbar from "./date-navigation-toolbar";
import dayjsLocalizer from "./dayjs-localizer";
import { DateTimeOption, DateTimePickerProps } from "./types";
import { formatDateWithoutTime, formatDateWithoutTz } from "./utils";

const localizer = dayjsLocalizer(dayjs);

const WeekCalendar: React.FunctionComponent<DateTimePickerProps> = ({
  title,
  options,
  onNavigate,
  date,
  onChange,
  duration,
  onChangeDuration,
}) => {
  const [scrollToTime, setScrollToTime] = React.useState<Date>();

  useMount(() => {
    // Bit of a hack to force rbc to scroll to the right time when we close/open a modal
    setScrollToTime(dayjs(date).add(-60, "minutes").toDate());
  });

  return (
    <Calendar
      events={options.map((option) => {
        if (option.type === "date") {
          return { title, start: new Date(option.date) };
        } else {
          return {
            title,
            start: new Date(option.start),
            end: new Date(option.end),
          };
        }
      })}
      culture="default"
      onNavigate={onNavigate}
      date={date}
      className="h-[calc(100vh-220px)] max-h-[800px] min-h-[400px] w-full"
      defaultView="week"
      views={["week"]}
      selectable={true}
      localizer={localizer}
      onSelectEvent={(event) => {
        onChange(
          options.filter(
            (option) =>
              !(
                option.type === "timeSlot" &&
                option.start === formatDateWithoutTz(event.start) &&
                event.end &&
                option.end === formatDateWithoutTz(event.end)
              ),
          ),
        );
      }}
      components={{
        toolbar: function Toolbar(props) {
          return (
            <DateNavigationToolbar
              year={props.date.getFullYear()}
              label={props.label}
              onPrevious={() => {
                props.onNavigate("PREV");
              }}
              onToday={() => {
                props.onNavigate("TODAY");
              }}
              onNext={() => {
                props.onNavigate("NEXT");
              }}
            />
          );
        },
        eventWrapper: function EventWraper(props) {
          const start = dayjs(props.event.start);
          const end = dayjs(props.event.end);
          return (
            <div
              // onClick prop doesn't work properly. Seems like some other element is cancelling the event before it reaches this element
              onMouseUp={props.onClick}
              className="absolute ml-1 max-h-full overflow-hidden rounded-md bg-green-100 p-1 text-xs text-green-500 transition-colors"
              style={{
                top: `calc(${props.style?.top}% + 4px)`,
                height: `calc(${props.style?.height}% - 8px)`,
                left: `${props.style?.xOffset}%`,
                width: `calc(${props.style?.width}%)`,
              }}
            >
              <div>{start.format("LT")}</div>
              <div className="font-semibold">{getDuration(start, end)}</div>
            </div>
          );
        },
        week: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          header: function Header({ date }: any) {
            const dateString = formatDateWithoutTime(date);
            const selectedOption = options.find((option) => {
              return option.type === "date" && option.date === dateString;
            });
            return (
              <span
                onClick={() => {
                  if (!selectedOption) {
                    onChange([
                      ...options,
                      {
                        type: "date",
                        date: formatDateWithoutTime(date),
                      },
                    ]);
                  } else {
                    onChange(
                      options.filter((option) => option !== selectedOption),
                    );
                  }
                }}
                className={clsx(
                  "inline-flex w-full items-center justify-center rounded-md py-2 text-sm hover:bg-gray-50 hover:text-gray-700",
                  {
                    "bg-green-50 text-green-600 hover:bg-green-50 hover:bg-opacity-75 hover:text-green-600":
                      !!selectedOption,
                  },
                )}
              >
                <span className="mr-1 font-normal opacity-50">
                  {dayjs(date).format("ddd")}
                </span>
                <span className="font-medium">{dayjs(date).format("DD")}</span>
              </span>
            );
          },
        },
        timeSlotWrapper: function TimeSlotWrapper({
          children,
        }: {
          children?: React.ReactNode;
        }) {
          return <div className="h-8 text-xs text-gray-500">{children}</div>;
        },
      }}
      step={15}
      onSelectSlot={({ start, end, action }) => {
        // on select slot
        const startDate = new Date(start);
        const endDate = new Date(end);

        const newEvent: DateTimeOption = {
          type: "timeSlot",
          start: formatDateWithoutTz(startDate),
          duration: dayjs(endDate).diff(endDate, "minutes"),
          end: formatDateWithoutTz(endDate),
        };

        if (action === "select") {
          const diff = dayjs(endDate).diff(startDate, "minutes");
          if (diff < 60 * 24) {
            onChangeDuration(diff);
          }
        } else {
          newEvent.end = formatDateWithoutTz(
            dayjs(startDate).add(duration, "minutes").toDate(),
          );
        }

        const alreadyExists = options.some(
          (option) =>
            option.type === "timeSlot" &&
            option.start === newEvent.start &&
            option.end === newEvent.end,
        );

        if (!alreadyExists) {
          onChange([...options, newEvent]);
        }
      }}
      scrollToTime={scrollToTime}
    />
  );
};

export default WeekCalendar;
