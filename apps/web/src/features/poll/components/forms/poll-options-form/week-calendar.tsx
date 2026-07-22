"use client";

import type {
  CalendarView,
  EventCalendarApi,
  EventCalendarOccurrence,
  EventCalendarProposedUpdate,
  EventCalendarSlotDraft,
  EventCalendarSlotInfo,
  EventCalendarUpdateResult,
} from "@rallly/ui/event-calendar";
import {
  EventCalendar,
  EventCalendarContent,
  EventCalendarDayView,
  EventCalendarWeekView,
  useEventCalendarNavigation,
} from "@rallly/ui/event-calendar";
import React from "react";
import { createBreakpoint } from "react-use";
import { useDateTime, useDateTimeConfig } from "@/lib/datetime/client";
import { getBrowserTimeZone } from "@/lib/utils/date-time-utils";

import DateNavigationToolbar from "./date-navigation-toolbar";
import type { DateTimePickerProps } from "./types";
import {
  DURATION_CAP_MINUTES,
  durationMinutes,
  isDuplicate,
  optionsToEvents,
  slotToTimeOption,
} from "./week-calendar-utils";

const useDevice = createBreakpoint({ desktop: 720, mobile: 360 });

// The week/day picker only creates timed slots; all-day (date) options are a
// month-view concept. Hide the all-day lane so it isn't a dead interactive
// surface (rbc hid it too, via CSS).
const WeekViewNoAllDay = () => <EventCalendarWeekView showAllDay={false} />;
const DayViewNoAllDay = () => <EventCalendarDayView showAllDay={false} />;
const VIEW_COMPONENTS = { week: WeekViewNoAllDay, day: DayViewNoAllDay };

// ReUI's grid needs a fixed IANA zone to lay out days/hours. The poll form
// stores naive wall-clock strings with no zone of their own, so this zone is
// used purely as a rendering frame — every option <-> event conversion still
// goes through the Task 4 helpers (formatDateWithoutTz), never a real zone
// conversion of stored values.
const RENDER_TIME_ZONE = getBrowserTimeZone();

function CalendarToolbar() {
  const { title, next, prev, today } = useEventCalendarNavigation();
  return (
    <DateNavigationToolbar
      label={title}
      onPrevious={prev}
      onNext={next}
      onToday={today}
    />
  );
}

const WeekCalendar: React.FunctionComponent<DateTimePickerProps> = ({
  options,
  onNavigate,
  date,
  onChange,
  duration = 60,
  onChangeDuration,
}) => {
  const { weekStart } = useDateTimeConfig();
  const { formatDateTime, formatDateTimeRange } = useDateTime();

  const apiRef = React.useRef<EventCalendarApi | null>(null);
  const hasScrolledRef = React.useRef(false);

  const events = React.useMemo(() => optionsToEvents(options), [options]);

  const defaultView = useDevice() === "mobile" ? "day" : "week";

  // The form works in naive local times; format in the render-frame zone.
  const formatTime = React.useCallback(
    (time: Date) =>
      formatDateTime(time, "time", { timeZone: RENDER_TIME_ZONE }),
    [formatDateTime],
  );

  const i18n = React.useMemo(
    () => ({
      functions: {
        formatTitle: (
          _view: CalendarView,
          ctx: { activeRange: { start: Date; end: Date } },
        ) =>
          formatDateTimeRange(
            ctx.activeRange.start,
            ctx.activeRange.end,
            "date",
            {
              timeZone: RENDER_TIME_ZONE,
            },
          ),
        formatEventTime: (start: Date, _end: Date, allDay: boolean) =>
          allDay ? "" : formatTime(start),
        formatDayRange: (range: { start: Date; end: Date }) =>
          formatDateTimeRange(range.start, range.end, "monthDay", {
            timeZone: RENDER_TIME_ZONE,
          }),
      },
    }),
    [formatDateTimeRange, formatTime],
  );

  React.useEffect(() => {
    if (hasScrolledRef.current) return;
    const firstSlot = options.find((option) => option.type === "timeSlot");
    if (firstSlot) {
      hasScrolledRef.current = true;
      apiRef.current?.scrollToTime(new Date(firstSlot.start));
    }
  }, [options]);

  const handleSelectSlot = (slot: EventCalendarSlotDraft) => {
    // The all-day lane is a timed picker's dead zone: it would commit
    // midnight-to-midnight garbage slots. rbc hid this row entirely.
    if (slot.allDay) {
      return;
    }
    const candidate = slotToTimeOption(slot.start, slot.end);
    const diff = durationMinutes(slot.start, slot.end);
    if (diff < DURATION_CAP_MINUTES) {
      onChangeDuration(diff);
    }
    if (!isDuplicate(options, candidate)) {
      onChange([...options, candidate]);
    }
  };

  const handleSlotClick = (slot: EventCalendarSlotInfo) => {
    if (slot.allDay) {
      return;
    }
    const start = slot.date;
    const end = new Date(start.getTime() + (duration || 60) * 60 * 1000);
    const candidate = slotToTimeOption(start, end);
    if (!isDuplicate(options, candidate)) {
      onChange([...options, candidate]);
    }
  };

  const handleEventClick = (occurrence: EventCalendarOccurrence) => {
    const clicked = slotToTimeOption(occurrence.start, occurrence.end);
    onChange(
      options.filter(
        (option) =>
          !(
            option.type === "timeSlot" &&
            option.start === clicked.start &&
            option.end === clicked.end
          ),
      ),
    );
  };

  const handleEventUpdate = (
    update: EventCalendarProposedUpdate,
  ): EventCalendarUpdateResult => {
    if (!update.occurrence) {
      return false;
    }
    const oldOption = slotToTimeOption(
      update.occurrence.start,
      update.occurrence.end,
    );
    const newOption = slotToTimeOption(update.start, update.end);

    const duplicatesAnother = options.some(
      (option) =>
        option.type === "timeSlot" &&
        option.start === newOption.start &&
        option.end === newOption.end &&
        !(option.start === oldOption.start && option.end === oldOption.end),
    );
    if (duplicatesAnother) {
      return false;
    }

    if (update.source.startsWith("resize")) {
      const diff = durationMinutes(update.start, update.end);
      if (diff < DURATION_CAP_MINUTES) {
        onChangeDuration(diff);
      }
    }

    onChange(
      options.map((option) =>
        option.type === "timeSlot" &&
        option.start === oldOption.start &&
        option.end === oldOption.end
          ? newOption
          : option,
      ),
    );

    return true;
  };

  return (
    <div key={defaultView} className="relative h-150">
      <EventCalendar
        className="absolute inset-0"
        apiRef={apiRef}
        events={events}
        date={date}
        onDateChange={onNavigate}
        defaultView={defaultView}
        views={["week", "day"]}
        timeZone={RENDER_TIME_ZONE}
        weekStartsOn={weekStart as 0 | 1 | 2 | 3 | 4 | 5 | 6}
        slotDuration={15}
        snapDuration={30}
        i18n={i18n}
        renderTimeGutterSlot={({ time, hour, minute }) =>
          // The engine's default gutter uses date-fns with its own format
          // string, ignoring our 12h/24h preference. Render the hour label with
          // our Intl formatter instead. Suppress the day-start label (hour 0),
          // matching the default's top-edge suppression.
          hour === 0 && minute === 0 ? null : formatTime(time)
        }
        onSelectSlot={handleSelectSlot}
        onSlotClick={handleSlotClick}
        onEventClick={handleEventClick}
        onEventUpdate={handleEventUpdate}
        renderEvent={({ occurrence }) => {
          const start = occurrence.start;
          const end = occurrence.end;
          return (
            // A poll option is a PROPOSED time, not a confirmed event: a dotted
            // outline over a soft accent tint reads as "tentative". Kept visually
            // distinct from ReUI's dashed drag/resize ghost (which is fainter and
            // dashed, not dotted). Color flows from --ec-event-color.
            <div>
              <div>
                <div>
                  {formatDateTimeRange(start, end, "time", {
                    timeZone: RENDER_TIME_ZONE,
                  })}
                </div>
              </div>
            </div>
          );
        }}
      >
        <CalendarToolbar />
        <EventCalendarContent components={VIEW_COMPONENTS} />
      </EventCalendar>
    </div>
  );
};

export default WeekCalendar;
