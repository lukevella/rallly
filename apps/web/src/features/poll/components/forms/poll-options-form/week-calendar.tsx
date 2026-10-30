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
import { useFormContext } from "react-hook-form";
import { createBreakpoint } from "react-use";
import type { NewEventData } from "@/features/poll/components/forms/types";
import { isPollFormOptionPast } from "@/features/poll/utils";
import { Trans, useTranslation } from "@/i18n/client";
import { useDateTime, useDateTimeConfig } from "@/lib/datetime/client";
import { useCurrentTime } from "@/lib/datetime/use-current-time";
import { getBrowserTimeZone } from "@/lib/utils/date-time-utils";
import DateNavigationToolbar from "./date-navigation-toolbar";
import type { DateTimePickerProps, TimeOption } from "./types";
import {
  DURATION_CAP_MINUTES,
  dateToFloating,
  durationMinutes,
  FLOATING_TIME_ZONE,
  floatingToDate,
  floatingToInstant,
  instantToFloating,
  isDuplicate,
  optionsToEvents,
  skippedMinuteRanges,
  slotToTimeOption,
  startExistsIn,
} from "./week-calendar-utils";

const useDevice = createBreakpoint({ desktop: 720, mobile: 360 });

// The week/day picker only creates timed slots; all-day (date) options are a
// month-view concept. Hide the all-day lane so it isn't a dead interactive
// surface (rbc hid it too, via CSS).
const WeekViewNoAllDay = () => <EventCalendarWeekView showAllDay={false} />;
const DayViewNoAllDay = () => <EventCalendarDayView showAllDay={false} />;
const VIEW_COMPONENTS = { week: WeekViewNoAllDay, day: DayViewNoAllDay };

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

/**
 * Edits timed poll options and rejects creating or moving a slot before now.
 */
const WeekCalendar: React.FunctionComponent<DateTimePickerProps> = ({
  options,
  onNavigate,
  date,
  onChange,
  duration = 60,
  onChangeDuration,
  timeZone: pollTimeZone,
}) => {
  const { t } = useTranslation();
  const { weekStart, timeZone: configuredTimeZone } = useDateTimeConfig();
  const viewerTimeZone = configuredTimeZone ?? getBrowserTimeZone();
  const { formatDateTime, formatDateTimeRange } = useDateTime();
  const form = useFormContext<NewEventData>();
  const timeZone =
    pollTimeZone ??
    (form.watch("lockTimeZone")
      ? "UTC"
      : (viewerTimeZone ?? getBrowserTimeZone()));
  const now = useCurrentTime();

  /** Checks a wall-clock slot against now using the poll's selected zone. */
  const isPast = (time: Date, checkedAt = now) =>
    checkedAt !== null &&
    isPollFormOptionPast({
      option: {
        type: "timeSlot",
        start: dateToFloating(time),
        end: dateToFloating(time),
      },
      now: checkedAt,
      timeZone,
    });

  // The grid runs on floating time; today, the now line and the shared
  // navigation date come from the viewer's own clock.
  const getNow = React.useCallback(
    () => instantToFloating(new Date(), viewerTimeZone),
    [viewerTimeZone],
  );
  const floatingDate = React.useMemo(
    () => (date ? instantToFloating(date, viewerTimeZone) : undefined),
    [date, viewerTimeZone],
  );
  const handleNavigate = (next: Date) =>
    onNavigate(floatingToInstant(next, viewerTimeZone));

  // A slot starting in the hour the poll's clocks skip when they spring
  // forward would silently shift on save, so it can't be picked. The skipped
  // hour is drawn as a disabled band that takes the pointer itself.
  const isAvailable = (option: TimeOption) =>
    !pollTimeZone || startExistsIn(option, pollTimeZone);
  const isAvailableSlot = (start: Date, end: Date) =>
    isAvailable(slotToTimeOption(start, end));

  const apiRef = React.useRef<EventCalendarApi | null>(null);
  const hasScrolledRef = React.useRef(false);

  const events = React.useMemo(() => optionsToEvents(options), [options]);

  const defaultView = useDevice() === "mobile" ? "day" : "week";

  // The form works in naive local times; format in the render-frame zone.
  const formatTime = React.useCallback(
    (time: Date) =>
      formatDateTime(time, "time", { timeZone: FLOATING_TIME_ZONE }),
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
              timeZone: FLOATING_TIME_ZONE,
            },
          ),
        formatEventTime: (start: Date, _end: Date, allDay: boolean) =>
          allDay ? "" : formatTime(start),
        formatDayRange: (range: { start: Date; end: Date }) =>
          formatDateTimeRange(range.start, range.end, "monthDay", {
            timeZone: FLOATING_TIME_ZONE,
          }),
      },
    }),
    [formatDateTimeRange, formatTime],
  );

  // Scroll to the earliest pre-existing slot exactly once, on mount, so the
  // calendar opens on the user's existing options. Slots the user adds
  // interactively must NOT trigger this — otherwise the first slot they select
  // gets yanked to the top of the viewport.
  // biome-ignore lint/correctness/useExhaustiveDependencies: mount-only, reads latest options
  React.useEffect(() => {
    hasScrolledRef.current = true;
    // `options` is in selection order, not chronological, so pick the earliest
    // slot by start time. The naive `YYYY-MM-DDTHH:mm:ss` strings are
    // fixed-width, so lexicographic min equals chronological min.
    const earliestSlot = options.reduce<TimeOption | undefined>(
      (earliest, option) =>
        option.type === "timeSlot" &&
        (!earliest || option.start < earliest.start)
          ? option
          : earliest,
      undefined,
    );
    if (earliestSlot) {
      apiRef.current?.scrollToTime(floatingToDate(earliestSlot.start));
    }
  }, []);

  /** Adds a dragged slot only when its start is still in the future. */
  const handleSelectSlot = (slot: EventCalendarSlotDraft) => {
    // The all-day lane is a timed picker's dead zone: it would commit
    // midnight-to-midnight garbage slots. rbc hid this row entirely.
    if (slot.allDay) {
      return;
    }
    if (isPast(slot.start, new Date())) {
      return;
    }
    const candidate = slotToTimeOption(slot.start, slot.end);
    if (!isAvailable(candidate)) {
      return;
    }
    const diff = durationMinutes(slot.start, slot.end);
    if (diff < DURATION_CAP_MINUTES) {
      onChangeDuration(diff);
    }
    if (!isDuplicate(options, candidate)) {
      onChange([...options, candidate]);
    }
  };

  /** Adds the default-duration slot for a clicked future calendar time. */
  const handleSlotClick = (slot: EventCalendarSlotInfo) => {
    if (slot.allDay) {
      return;
    }
    const start = slot.date;
    if (isPast(start, new Date())) {
      return;
    }
    const end = new Date(start.getTime() + (duration || 60) * 60 * 1000);
    const candidate = slotToTimeOption(start, end);
    if (!isAvailable(candidate)) {
      return;
    }
    if (!isDuplicate(options, candidate)) {
      onChange([...options, candidate]);
    }
  };

  const handleEventClick = (occurrence: EventCalendarOccurrence) => {
    const clicked = slotToTimeOption(occurrence.start, occurrence.end);
    const optionIndex = options.findIndex(
      (option) =>
        option.type === "timeSlot" &&
        option.start === clicked.start &&
        option.end === clicked.end,
    );
    if (optionIndex !== -1) {
      onChange(options.filter((_, index) => index !== optionIndex));
    }
  };

  /** Rejects moving or resizing a slot into the past or onto a duplicate. */
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
    if (!isAvailable(newOption)) {
      return false;
    }

    if (isPast(update.start, new Date())) {
      return false;
    }

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
          ? {
              ...newOption,
              id: option.id,
              maxParticipants: option.maxParticipants,
            }
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
        date={floatingDate}
        onDateChange={handleNavigate}
        defaultView={defaultView}
        views={["week", "day"]}
        timeZone={FLOATING_TIME_ZONE}
        getNow={getNow}
        canSelectSlot={(slot) =>
          slot.allDay || isAvailableSlot(slot.start, slot.end)
        }
        canDropEvent={(update) => isAvailableSlot(update.start, update.end)}
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
        renderDayColumnBackground={({ day, boundsStartMin }) =>
          pollTimeZone
            ? skippedMinuteRanges(
                dateToFloating(day).slice(0, 10),
                pollTimeZone,
              ).map(([start, end]) => (
                <div
                  key={start}
                  className="pointer-events-auto absolute inset-x-0 cursor-not-allowed overflow-hidden border-y border-dashed bg-[repeating-linear-gradient(135deg,transparent_0_6px,var(--color-border)_6px_7px)] bg-muted px-1.5 py-0.5 text-muted-foreground text-xs"
                  style={{
                    top: `calc(var(--ec-hour-height) * ${(start - boundsStartMin) / 60})`,
                    height: `calc(var(--ec-hour-height) * ${(end - start) / 60})`,
                  }}
                  title={t("weekCalendarClocksGoForwardHelp", {
                    defaultValue:
                      "Clocks in {timeZone} skip this time when they go forward",
                    timeZone: pollTimeZone,
                  })}
                >
                  <Trans
                    i18nKey="weekCalendarClocksGoForward"
                    defaults="Clocks go forward"
                  />
                </div>
              ))
            : null
        }
        onSelectSlot={handleSelectSlot}
        onSlotClick={handleSlotClick}
        onEventClick={handleEventClick}
        onEventUpdate={handleEventUpdate}
        renderEvent={({ occurrence }) => {
          const start = occurrence.start;
          const end = occurrence.end;

          const optionIsPast = isPast(start);
          return (
            // A poll option is a PROPOSED time, not a confirmed event: a dotted
            // outline over a soft accent tint reads as "tentative". Kept visually
            // distinct from ReUI's dashed drag/resize ghost (which is fainter and
            // dashed, not dotted). Color flows from --ec-event-color.
            <div
              className={`${
                optionIsPast
                  ? "h-full border-red-300 bg-red-500/10 text-red-700"
                  : ""
              }`}
            >
              <div>
                <div>
                  {formatDateTimeRange(start, end, "time", {
                    timeZone: FLOATING_TIME_ZONE,
                  })}
                </div>
                {optionIsPast && (
                  <div className="font-medium text-[10px] text-red-600 leading-tight">
                    <Trans
                      i18nKey="weekCalendarPastOptionWarning"
                      defaults="You can't choose a date or time in the past."
                    />
                  </div>
                )}
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
