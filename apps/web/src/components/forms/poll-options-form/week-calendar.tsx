import { XIcon } from "@rallly/icons";
import dayjs from "dayjs";
import React from "react";
import { Calendar } from "react-big-calendar";
import { useMount } from "react-use";

import { getDuration } from "../../../utils/date-time-utils";
import DateNavigationToolbar from "./date-navigation-toolbar";
import dayjsLocalizer from "./dayjs-localizer";
import { DateTimeOption, DateTimePickerProps } from "./types";
import { formatDateWithoutTz } from "./utils";

const localizer = dayjsLocalizer(dayjs);

const WeekCalendar: React.FunctionComponent<DateTimePickerProps> = ({
  options,
  onNavigate,
  date,
  onChange,
  duration = 60,
  onChangeDuration,
}) => {
  return (
    <div
      key=""
      className="h-[600px] max-h-[800px] min-h-[400px] rounded-md border"
    >
      <Calendar
        events={options.map((option) => {
          if (option.type === "date") {
            return { start: new Date(option.date) };
          } else {
            return {
              start: new Date(option.start),
              end: new Date(option.end),
            };
          }
        })}
        culture="default"
        onNavigate={onNavigate}
        date={date}
        className=" w-full"
        defaultView="week"
        views={["week", "day"]}
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
                className="bg-primary-50 text-primary-500 hover:bg-primary-100 hover:text-primary-600 border-primary-100 group absolute ml-1 flex  max-h-full flex-col justify-between overflow-hidden rounded-lg border p-1 text-xs shadow-sm hover:cursor-pointer"
                style={{
                  top: `calc(${props.style?.top}% + 4px)`,
                  height: `calc(${props.style?.height}% - 8px)`,
                  left: `${props.style?.xOffset}%`,
                  width: `calc(${props.style?.width}%)`,
                }}
              >
                <div className="from-primary-100 to-primary-100/0 absolute top-1.5 right-1.5 flex justify-end  bg-gradient-to-l opacity-0 group-hover:opacity-100">
                  <XIcon className="h-3 w-3" />
                </div>
                <div>
                  <div className="font-semibold">{start.format("LT")}</div>
                  <div className="opacity-50">{getDuration(start, end)}</div>
                </div>
                <div>
                  <div className="opacity-50">{end.format("LT")}</div>
                </div>
              </div>
            );
          },
          week: {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            header: function Header({ date }: any) {
              return (
                <span className="w-full rounded-md py-2 text-center text-xs">
                  <span className="mr-1.5  font-normal opacity-50">
                    {dayjs(date).format("ddd")}
                  </span>
                  <span className="font-medium">
                    {dayjs(date).format("DD")}
                  </span>
                </span>
              );
            },
          },
          timeSlotWrapper: function TimeSlotWrapper({
            children,
          }: {
            children?: React.ReactNode;
          }) {
            return <div className="h-7 text-xs text-gray-500">{children}</div>;
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
        scrollToTime={date}
      />
    </div>
  );
};

export default WeekCalendar;
