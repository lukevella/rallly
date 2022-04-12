import clsx from "clsx";
import {
  addMinutes,
  differenceInMinutes,
  format,
  getDay,
  parse,
  startOfWeek,
} from "date-fns";
import React from "react";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import { useMount } from "react-use";

import DateNavigationToolbar from "./date-navigation-toolbar";
import { DateTimeOption, DateTimePickerProps } from "./types";
import { formatDateWithoutTime, formatDateWithoutTz } from "./utils";

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: (date: Date | number) => startOfWeek(date, { weekStartsOn: 1 }),
  getDay,
  locales: {},
});

const WeekCalendar: React.VoidFunctionComponent<DateTimePickerProps> = ({
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
    setScrollToTime(addMinutes(date, -60));
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
        toolbar: (props) => {
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
        eventWrapper: (props) => {
          return (
            <div
              // onClick prop doesn't work properly. Seems like some other element is cancelling the event before it reaches this element
              onMouseUp={props.onClick}
              className="absolute p-1 ml-1 max-h-full hover:bg-opacity-50 transition-colors cursor-pointer overflow-hidden bg-green-100 bg-opacity-80 text-green-500 rounded-md text-xs"
              style={{
                top: `calc(${props.style?.top}% + 4px)`,
                height: `calc(${props.style?.height}% - 8px)`,
                left: `${props.style?.xOffset}%`,
                width: `calc(${props.style?.width}%)`,
              }}
            >
              <div>{format(props.event.start, "p")}</div>
              <div className="font-bold w-full truncate">
                {props.event.title}
              </div>
            </div>
          );
        },
        week: {
          header: ({ date }: any) => {
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
                  "inline-flex w-full justify-center hover:text-gray-700 hover:bg-slate-50 rounded-md items-center text-sm py-2",
                  {
                    "bg-green-50 text-green-600 hover:bg-opacity-75 hover:bg-green-50 hover:text-green-600":
                      !!selectedOption,
                  },
                )}
              >
                <span className="font-normal opacity-50 mr-1">
                  {format(date, "E")}
                </span>
                <span className="font-medium">{format(date, "dd")}</span>
              </span>
            );
          },
        },
        timeSlotWrapper: ({ children }) => {
          return <div className="h-12 text-xs text-gray-500">{children}</div>;
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
          end: formatDateWithoutTz(endDate),
        };

        if (action === "select") {
          const diff = differenceInMinutes(endDate, startDate);
          if (diff < 60 * 24) {
            onChangeDuration(diff);
          }
        } else {
          newEvent.end = formatDateWithoutTz(addMinutes(startDate, duration));
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
