// Title: Event Calendar Month View
// Description: ARIA-grid month view with week rows, day cells, event chips, and overflow counts.

"use client";

import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { addDays, format, getWeek } from "date-fns";
import type { CSSProperties, Ref } from "react";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { cn } from "../lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "../popover";
import { ScrollArea } from "../scroll-area";
import {
  EventCalendarViewContext,
  useEventCalendar,
  useEventCalendarDay,
  useEventCalendarSelector,
  useEventCalendarSettings,
  useEventCalendarViewConfig,
  useEventCalendarViewSettings,
  useEventCalendarWeek,
} from "./event-calendar";
import {
  useEventCalendarGestures,
  wasRecentChipPress,
  wasRecentDrag,
} from "./event-calendar-dnd";
import {
  EVENT_CALENDAR_GHOST,
  EventCalendarEvent,
} from "./event-calendar-event";
import {
  getDayKey,
  getRangeKey,
  resolveOffDay,
  toZoned,
  zonedStartOfDay,
} from "./event-calendar-lib";
import type {
  EventCalendarDateRange,
  EventCalendarDragState,
  EventCalendarSegment,
} from "./event-calendar-types";
import { IconPlaceholder } from "./icon-placeholder";

// Layout-effect on the client (measure before paint, no flash), plain effect on
// the server (never runs there) to avoid the SSR useLayoutEffect warning.
const useIsoLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

interface EventCalendarMonthViewProps extends useRender.ComponentProps<"div"> {
  maxEventsPerCell?: number | "auto";
}

function EventCalendarMonthView({
  className,
  render,
  maxEventsPerCell,
  ...props
}: EventCalendarMonthViewProps) {
  const instance = useEventCalendar();
  const settings = useEventCalendarSettings();
  const viewConfig = useEventCalendarViewConfig();
  const visibleRange = useEventCalendarSelector<
    unknown,
    EventCalendarDateRange
  >((state) => state.visibleRange, {
    isEqual: (a, b) => getRangeKey(a) === getRangeKey(b),
  });
  const anchorDate = useEventCalendarSelector((state) => state.date);

  const { effective } = useEventCalendarViewSettings();
  const weeks = useMemo(() => {
    const days: Date[] = [];
    let cursor = zonedStartOfDay(visibleRange.start, settings.timeZone);
    while (cursor < visibleRange.end) {
      days.push(cursor);
      cursor = zonedStartOfDay(
        addDays(toZoned(cursor, settings.timeZone), 1),
        settings.timeZone,
      );
    }
    const rows: Date[][] = [];
    for (let i = 0; i < days.length; i += 7) rows.push(days.slice(i, i + 7));
    if (effective.weekends) return rows;
    return rows.map((row) =>
      row.filter(
        (day) =>
          !settings.weekendDays.includes(
            toZoned(day, settings.timeZone).getDay(),
          ),
      ),
    );
  }, [
    visibleRange,
    settings.timeZone,
    settings.weekendDays,
    effective.weekends,
  ]);

  const headerDays = weeks[0] ?? [];
  const title = settings.i18n.functions.formatTitle("month", {
    date: toZoned(anchorDate, settings.timeZone),
    activeRange: instance.api.getActiveRange(),
    visibleRange,
    locale: settings.locale,
  });

  const gridTemplateColumns = `${effective.weekNumbers ? "var(--ec-week-number-w, 2.75rem) " : ""}repeat(${headerDays.length}, minmax(0, 1fr))`;
  const cap = maxEventsPerCell ?? viewConfig.maxEventsPerCell;
  const contained = viewConfig.scrollMode !== "page";

  // "auto" fits as many event rows as the cell height allows and rolls the rest
  // into "+N more". Only the contained mode gives a cell a bounded height to
  // measure; page mode grows to fit, so "auto" there keeps the fixed fallback.
  const autoFit = cap === "auto" && contained;
  // slotProbe resolves the event-row height (--ec-month-bar-h) to px, honoring
  // the current font size and any consumer override; contentProbe is the first
  // cell's flex-1 content area, whose height is the event space per cell.
  const slotProbeRef = useRef<HTMLDivElement | null>(null);
  const contentProbeRef = useRef<HTMLDivElement | null>(null);
  const [autoCap, setAutoCap] = useState<number | null>(null);
  const measureCap = useCallback(() => {
    const content = contentProbeRef.current;
    const slot = slotProbeRef.current;
    if (!content || !slot) return;
    const laneH = slot.getBoundingClientRect().height;
    if (laneH <= 0) return;
    const cs = getComputedStyle(content);
    const inner =
      content.clientHeight - (Number.parseFloat(cs.paddingTop) || 0);
    const gap = Number.parseFloat(cs.rowGap) || 0;
    // N rows occupy N*laneH - gap (the last row has no trailing gap)
    setAutoCap(Math.max(1, Math.floor((inner + gap) / laneH)));
  }, []);
  useIsoLayoutEffect(() => {
    if (!autoFit) {
      setAutoCap(null);
      return;
    }
    const content = contentProbeRef.current;
    if (!content || typeof ResizeObserver === "undefined") return;
    measureCap();
    const observer = new ResizeObserver(measureCap);
    observer.observe(content);
    return () => observer.disconnect();
    // re-observe the first cell after a re-layout (row count or month change)
  }, [autoFit, measureCap, weeks.length, anchorDate]);
  const resolvedCap = cap === "auto" ? (autoFit ? (autoCap ?? 3) : 3) : cap;

  const defaultProps = {
    "data-slot": "event-calendar-month-view",
    "data-view": "month",
    role: "grid",
    "aria-label": title,
    className: cn(
      "flex flex-col border-t",
      contained && "min-h-0 flex-1 overflow-hidden",
      viewConfig.classNames?.monthView,
      className,
    ),
    children: (
      <>
        <div
          role="row"
          data-slot="event-calendar-month-header"
          // @container scopes the narrow-label breakpoint to the header row
          className={cn(
            "@container grid border-b",
            viewConfig.classNames?.monthHeader,
          )}
          style={{ gridTemplateColumns }}
        >
          {effective.weekNumbers && (
            <div
              role="columnheader"
              aria-hidden
              className={cn(
                "border-e px-2 py-1.5",
                viewConfig.classNames?.weekNumber,
              )}
            />
          )}
          {headerDays.map((day) => (
            <div
              key={day.getTime()}
              role="columnheader"
              className={cn(
                "truncate px-2 py-1.5 font-medium text-muted-foreground",
                viewConfig.classNames?.monthDayHeader,
              )}
            >
              {viewConfig.renderDayHeader?.({
                day,
                view: "month",
                isToday:
                  getDayKey(day, settings.timeZone) ===
                  getDayKey(new Date(), settings.timeZone),
              }) ?? (
                <>
                  <span className="@max-[36rem]:hidden">
                    {format(
                      toZoned(day, settings.timeZone),
                      settings.i18n.formats.monthDayHeader,
                      { locale: settings.locale },
                    )}
                  </span>
                  <span className="@max-[36rem]:inline hidden">
                    {format(
                      toZoned(day, settings.timeZone),
                      settings.i18n.formats.monthDayHeaderNarrow,
                      { locale: settings.locale },
                    )}
                  </span>
                </>
              )}
            </div>
          ))}
        </div>
        <div
          data-slot="event-calendar-month-body"
          className={cn(
            "grid",
            contained && "min-h-0 flex-1",
            viewConfig.classNames?.monthBody,
          )}
          style={{
            gridTemplateRows: contained
              ? `repeat(${weeks.length}, minmax(0, 1fr))`
              : `repeat(${weeks.length}, minmax(var(--ec-month-row-min-h, 8rem), auto))`,
          }}
        >
          {weeks.map((week, rowIndex) => (
            <EventCalendarMonthWeek
              key={rowIndex}
              week={week}
              gridTemplateColumns={gridTemplateColumns}
              showWeekNumber={effective.weekNumbers}
              cap={resolvedCap}
              autoFit={autoFit}
              contentRef={rowIndex === 0 ? contentProbeRef : undefined}
            />
          ))}
        </div>
        {autoFit && (
          <div
            ref={slotProbeRef}
            aria-hidden
            className="pointer-events-none invisible absolute h-[var(--ec-month-bar-h,1.75rem)] w-0"
          />
        )}
      </>
    ),
  };

  return (
    <EventCalendarViewContext.Provider value={{ view: "month" }}>
      {useRender({
        defaultTagName: "div",
        render,
        props: mergeProps<"div">(defaultProps, props),
      })}
    </EventCalendarViewContext.Provider>
  );
}

/**
 * One month week row. Multi-day / all-day events render as CONTINUOUS bars in
 * an overlay grid that spans day columns (colStart -> colSpan) and stacks by
 * lane; single-day timed events render inside each cell below the reserved bar
 * lanes. This is what makes a cross-day event read as one whole block instead
 * of a chip repeated per cell.
 */
function EventCalendarMonthWeek({
  week,
  gridTemplateColumns,
  showWeekNumber,
  cap,
  autoFit,
  contentRef,
}: {
  week: Date[];
  gridTemplateColumns: string;
  showWeekNumber: boolean;
  cap: number;
  autoFit: boolean;
  /** Set on the first week only: forwarded to its first cell's content area so
   *  the view can measure the per-cell event height for "auto". */
  contentRef?: Ref<HTMLDivElement>;
}) {
  const settings = useEventCalendarSettings();
  const viewConfig = useEventCalendarViewConfig();
  const { bars, rowStart } = useEventCalendarWeek(week[0]);
  const colOffset = showWeekNumber ? 1 : 0;
  const dayMs = 86400000;
  const rowStartMs = zonedStartOfDay(
    rowStart ?? week[0],
    settings.timeZone,
  ).getTime();
  // Day offsets from the TRUE row start (0-6) for each visible column, so a
  // weekends-hidden month still places bars on the right days.
  const offsets = week.map((d) =>
    Math.round(
      (zonedStartOfDay(d, settings.timeZone).getTime() - rowStartMs) / dayMs,
    ),
  );
  /** Clamp a day-offset span onto the visible columns; null = fully hidden. */
  const gridPos = (colStart: number, colSpan: number) => {
    let start = -1;
    let end = -1;
    for (let o = colStart; o < colStart + colSpan; o++) {
      const col = offsets.indexOf(o);
      if (col === -1) continue;
      if (start === -1) start = col;
      end = col;
    }
    return start === -1 ? null : { col: start, span: end - start + 1 };
  };
  // bars fit within the cap; deeper lanes fall into each day's "+N more"
  const visibleBars = bars.filter((b) => (b.lane ?? 0) < cap);
  const covers = (b: EventCalendarSegment, dayOffset: number) =>
    (b.colStart ?? 0) <= dayOffset &&
    dayOffset < (b.colStart ?? 0) + (b.colSpan ?? 1);
  // Occurrence keys of the bars hidden in each column (lane >= cap). Threaded to
  // the cell so its "+N more" popover can list the hidden bars WITHOUT re-listing
  // the visible ones (day buckets carry no lane, so the week row - which owns bar
  // laning - is the only place that knows which bars are hidden).
  const hiddenBarKeysByCol = week.map(
    (_, col) =>
      new Set(
        bars
          .filter((b) => (b.lane ?? 0) >= cap && covers(b, offsets[col]))
          .map((b) => b.occurrence.key),
      ),
  );

  // Live move/resize ghost at the PROPOSED day span. Standardized treatment
  // (EVENT_CALENDAR_GHOST): move = the event carried as a full clone, resize =
  // the same clone with a dashed boundary; invalid adds destructive marking
  // while the engine shows the not-allowed cursor + validation hint.
  const dragGhost = useEventCalendarSelector<
    unknown,
    | (Pick<
        EventCalendarDragState,
        | "kind"
        | "valid"
        | "occurrence"
        | "proposedStart"
        | "proposedEnd"
        | "proposedAllDay"
      > & {
        colStart: number;
        colSpan: number;
        isStart: boolean;
        isEnd: boolean;
        color?: string;
      })
    | null
  >(
    (state) => {
      const drag = state.drag;
      if (!drag) return null;
      const rowEndMs = rowStartMs + 7 * dayMs;
      const startDayMs = zonedStartOfDay(
        drag.proposedStart,
        settings.timeZone,
      ).getTime();
      // exclusive end -> the last covered day
      const lastDayMs = zonedStartOfDay(
        new Date(drag.proposedEnd.getTime() - 1),
        settings.timeZone,
      ).getTime();
      if (startDayMs >= rowEndMs || lastDayMs < rowStartMs) return null;
      const startCol = Math.max(
        0,
        Math.round((startDayMs - rowStartMs) / dayMs),
      );
      const endCol = Math.min(6, Math.round((lastDayMs - rowStartMs) / dayMs));
      if (endCol < startCol) return null;
      return {
        kind: drag.kind,
        valid: drag.valid,
        occurrence: drag.occurrence,
        proposedStart: drag.proposedStart,
        proposedEnd: drag.proposedEnd,
        proposedAllDay: drag.proposedAllDay,
        colStart: startCol,
        colSpan: endCol - startCol + 1,
        isStart: startDayMs >= rowStartMs,
        isEnd: lastDayMs < rowEndMs,
        color: drag.occurrence.event.color,
      };
    },
    {
      isEqual: (a, b) =>
        a === b ||
        (a !== null &&
          b !== null &&
          a.colStart === b.colStart &&
          a.colSpan === b.colSpan &&
          a.valid === b.valid &&
          a.kind === b.kind &&
          a.proposedAllDay === b.proposedAllDay &&
          a.proposedStart.getTime() === b.proposedStart.getTime() &&
          a.proposedEnd.getTime() === b.proposedEnd.getTime()),
    },
  );
  const ghostPos = dragGhost
    ? gridPos(dragGhost.colStart, dragGhost.colSpan)
    : null;
  const ghostLane = dragGhost
    ? (bars.find((b) => b.occurrence.key === dragGhost.occurrence.key)?.lane ??
      0)
    : 0;
  // A single-day timed MOVE is indicated INLINE in the target cell (a
  // placeholder at the time-sorted position, rendered by EventCalendarMonthCell)
  // rather than as a bar in this overlay, so only bar drags and every resize
  // render the overlay ghost. Bars = all-day or multi-day (span > 1 day).
  const ghostIsBar =
    !!dragGhost &&
    (dragGhost.kind !== "move" ||
      dragGhost.proposedAllDay ||
      dragGhost.proposedEnd.getTime() - dragGhost.proposedStart.getTime() >
        dayMs);

  return (
    <div
      role="row"
      data-slot="event-calendar-month-row"
      className={cn(
        "relative grid min-h-0 border-b last:border-b-0",
        viewConfig.classNames?.monthRow,
      )}
      style={{ gridTemplateColumns }}
    >
      {showWeekNumber && (
        <div
          role="rowheader"
          data-slot="event-calendar-week-number"
          className={cn(
            "border-e px-2 pt-1 text-muted-foreground tabular-nums",
            viewConfig.classNames?.weekNumber,
          )}
        >
          {settings.i18n.labels.week(
            getWeek(toZoned(week[0], settings.timeZone), {
              weekStartsOn: settings.weekStartsOn,
            }),
          )}
        </div>
      )}
      {week.map((day, col) => (
        <EventCalendarMonthCell
          key={day.getTime()}
          day={day}
          cap={cap}
          // Reserve lane space only for bars that pass through THIS cell, so a
          // short multi-day event does not push down timed events in unrelated
          // cells of the same row. Reserve down to the deepest covering bar
          // lane so timed events always sit below every bar in their own cell.
          reservedLanes={visibleBars.reduce(
            (max, b) =>
              covers(b, offsets[col]) ? Math.max(max, (b.lane ?? 0) + 1) : max,
            0,
          )}
          hiddenBarKeys={hiddenBarKeysByCol[col]}
          isLast={col === week.length - 1}
          autoFit={autoFit}
          contentRef={col === 0 ? contentRef : undefined}
        />
      ))}
      {/* Continuous bar overlay: one element per bar, placed by grid-column so
          a cross-day span is a single unbroken block. pointer-events pass
          through the gaps to the cells below. NOT aria-hidden - these are the
          real interactive bars. */}
      {(visibleBars.length > 0 || (dragGhost && ghostPos && ghostIsBar)) && (
        <div
          data-slot="event-calendar-month-bar-overlay"
          className={cn(
            "pointer-events-none absolute inset-x-0 top-0 z-10 grid pt-1.5",
            viewConfig.classNames?.monthBarOverlay,
          )}
          style={{
            gridTemplateColumns,
            gridAutoRows: "var(--ec-month-bar-h, 1.75rem)",
          }}
        >
          {visibleBars.map((bar) => {
            const pos = gridPos(bar.colStart ?? 0, bar.colSpan ?? 1);
            if (!pos) return null;
            return (
              <div
                key={bar.occurrence.key}
                className={cn(
                  "pointer-events-auto min-w-0 px-1",
                  viewConfig.classNames?.monthBar,
                )}
                style={{
                  gridColumn: `${colOffset + pos.col + 1} / span ${pos.span}`,
                  gridRow: (bar.lane ?? 0) + 1,
                }}
              >
                {/* lane height minus the 2px inter-lane gap */}
                <EventCalendarEvent
                  segment={bar}
                  className="h-[calc(var(--ec-month-bar-h,1.75rem)-0.125rem)]"
                />
              </div>
            );
          })}
          {dragGhost && ghostPos && ghostIsBar && (
            <div
              aria-hidden
              className={cn("min-w-0 px-1", viewConfig.classNames?.monthBar)}
              style={{
                gridColumn: `${colOffset + ghostPos.col + 1} / span ${ghostPos.span}`,
                gridRow: ghostLane + 1,
              }}
            >
              <div
                data-slot="event-calendar-drag-ghost"
                data-kind={dragGhost.kind}
                data-drop-invalid={!dragGhost.valid || undefined}
                className={cn(
                  "h-[calc(var(--ec-month-bar-h,1.75rem)-0.125rem)]",
                  dragGhost.kind === "move"
                    ? // faint drop placeholder only: the cursor-attached
                      // carry clone owns the visual during moves
                      cn(
                        EVENT_CALENDAR_GHOST.move,
                        !dragGhost.valid && EVENT_CALENDAR_GHOST.invalid,
                      )
                    : cn(
                        EVENT_CALENDAR_GHOST.resize,
                        !dragGhost.valid && EVENT_CALENDAR_GHOST.invalidResize,
                      ),
                  viewConfig.classNames?.dragGhost,
                )}
                style={
                  {
                    "--ec-event-color":
                      dragGhost.color ?? "var(--color-primary)",
                  } as CSSProperties
                }
              >
                {dragGhost.kind !== "move" && (
                  <EventCalendarEvent
                    preview
                    segment={{
                      occurrence: {
                        ...dragGhost.occurrence,
                        start: dragGhost.proposedStart,
                        end: dragGhost.proposedEnd,
                      },
                      day: week[ghostPos.col] ?? week[0],
                      isStart: dragGhost.isStart,
                      isEnd: dragGhost.isEnd,
                      continuesBefore: !dragGhost.isStart,
                      continuesAfter: !dragGhost.isEnd,
                    }}
                    className={cn(
                      "inset-ring-0 h-full",
                      !dragGhost.valid && EVENT_CALENDAR_GHOST.invalidContent,
                    )}
                  />
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function EventCalendarMonthCell({
  day,
  cap,
  reservedLanes,
  hiddenBarKeys,
  isLast,
  autoFit,
  contentRef,
}: {
  day: Date;
  cap: number;
  reservedLanes: number;
  /** Occurrence keys of the bars hidden in THIS column (lane >= cap), from the
   *  week row. Lets the cell list hidden bars in its overflow popover without
   *  re-listing the bars already visible in the row overlay. */
  hiddenBarKeys: Set<string>;
  /** Last column in the row - drops the right border so the grid's outer edge
   *  is owned by the container, not a doubled cell border. Passed explicitly
   *  because the bar overlay renders after the cells, so `:last-child` is
   *  unreliable on rows that have bars. */
  isLast: boolean;
  /** When true, the "+N more" chip is treated as taking a row so the visible
   *  chips + indicator always fit the measured cell height. */
  autoFit: boolean;
  /** Set on the first cell only: measured to derive the "auto" cap. */
  contentRef?: Ref<HTMLDivElement>;
}) {
  // biome-ignore lint/correctness/noUnusedVariables: throws outside <EventCalendar>; kept as a guard
  const instance = useEventCalendar();
  const settings = useEventCalendarSettings();
  const viewConfig = useEventCalendarViewConfig();
  const gestures = useEventCalendarGestures();
  const { segments, isToday, isOutside } = useEventCalendarDay(day);

  const dayStart = zonedStartOfDay(day, settings.timeZone);
  const dayEnd = addDays(toZoned(dayStart, settings.timeZone), 1);
  const { effective } = useEventCalendarViewSettings();
  const isOff = resolveOffDay(
    day,
    settings.timeZone,
    effective.offDays
      ? typeof viewConfig.offDays === "object"
        ? viewConfig.offDays
        : true
      : false,
  );
  const offClassName =
    (typeof viewConfig.offDays === "object" && viewConfig.offDays.className) ||
    "bg-muted/25";

  const isDropTarget = useEventCalendarSelector<
    unknown,
    "valid" | "invalid" | null
  >((state) => {
    const drag = state.drag;
    if (!drag) return null;
    const covered = drag.proposedStart < dayEnd && drag.proposedEnd > dayStart;
    if (!covered) return null;
    return drag.valid ? "valid" : "invalid";
  });
  // Hide hover affordances mid-gesture: the only intent is the drop target
  const isInteracting = useEventCalendarSelector<unknown, boolean>(
    (state) => state.drag !== null || state.slotDraft !== null,
  );
  const inDraft = useEventCalendarSelector<
    unknown,
    { isStart: boolean; isEnd: boolean } | null
  >(
    (state) => {
      const draft = state.slotDraft;
      if (!draft || !draft.allDay) return null;
      if (draft.start >= dayEnd || draft.end <= dayStart) return null;
      return {
        isStart: draft.start >= dayStart,
        isEnd: draft.end <= dayEnd,
      };
    },
    {
      isEqual: (a, b) =>
        a === b ||
        (a !== null &&
          b !== null &&
          a.isStart === b.isStart &&
          a.isEnd === b.isEnd),
    },
  );
  // A single-day timed MOVE landing on THIS day: expose the proposed
  // minute-of-day (+ color/validity) so the cell can render a drop placeholder
  // at the correct time-sorted position, instead of the overlay marking a bar
  // over the first chip. Skipped for bars (they keep the overlay ghost) and for
  // a no-op move back onto the event's own day (the dimmed source already marks
  // the spot).
  const inlineDrop = useEventCalendarSelector<
    unknown,
    { min: number; valid: boolean; color?: string } | null
  >(
    (state) => {
      const drag = state.drag;
      if (!drag || drag.kind !== "move" || drag.proposedAllDay) return null;
      if (drag.proposedEnd.getTime() - drag.proposedStart.getTime() > 86400000)
        return null;
      const dropDayMs = zonedStartOfDay(
        drag.proposedStart,
        settings.timeZone,
      ).getTime();
      if (dropDayMs !== dayStart.getTime()) return null;
      if (
        zonedStartOfDay(drag.occurrence.start, settings.timeZone).getTime() ===
        dayStart.getTime()
      )
        return null;
      return {
        min: (drag.proposedStart.getTime() - dropDayMs) / 60000,
        valid: drag.valid,
        color: drag.occurrence.event.color,
      };
    },
    {
      isEqual: (a, b) =>
        a === b ||
        (a !== null &&
          b !== null &&
          a.min === b.min &&
          a.valid === b.valid &&
          a.color === b.color),
    },
  );

  // Bars (allDay/multi-day) are drawn by the week-row overlay; the cell renders
  // only single-day timed events, below the reserved bar lanes.
  const extraHidden = hiddenBarKeys.size;
  const hiddenBarSegs = segments.allDay.filter((s) =>
    hiddenBarKeys.has(s.occurrence.key),
  );
  const m = segments.timed.length;
  const timedSlots = Math.max(0, cap - reservedLanes);

  // Static (at-rest) split: what the cell shows with no drag, and - crucially -
  // what the "+N more" popover lists. The popover carries ONLY the hidden events
  // (hidden bars + timed past the cap), never the chips already visible in the
  // cell, so it never duplicates them. autoFit gives up one timed row to the
  // "+N more" indicator so the visible chips fit the clipped cell height.
  const staticOverflow = extraHidden > 0 || m > timedSlots;
  const staticShown =
    autoFit && staticOverflow ? Math.max(0, timedSlots - 1) : timedSlots;
  const overflowSegments = [
    ...hiddenBarSegs,
    ...segments.timed.slice(staticShown),
  ];

  // Live split: while a timed chip is dragged onto this day, render the day
  // exactly as it will look AFTER the drop. The dragged chip is a phantom in the
  // time-sorted order and is shown as the placeholder - inline where it lands,
  // or ON the "+N more" indicator when it lands in the overflow bucket (so the
  // user sees the drop will push it into "more"). The "+N more" count always
  // reflects the post-drop hidden total.
  let visibleTimed: EventCalendarSegment[];
  let overflowCount: number;
  let placeholderIndex: number;
  let placeholderAtMore: boolean;
  if (!inlineDrop) {
    visibleTimed = segments.timed.slice(0, staticShown);
    overflowCount = overflowSegments.length;
    placeholderIndex = -1;
    placeholderAtMore = false;
  } else {
    // rank of the dragged chip in the resulting time-sorted list (chips are
    // time-ordered, so this is the count starting at or before its time)
    const insertRank = segments.timed.filter(
      (s) => (s.startMin ?? 0) <= inlineDrop.min,
    ).length;
    const dropOverflow = extraHidden > 0 || m + 1 > timedSlots;
    // rows for timed items INCLUDING the phantom, before the "+N more" row
    const vis = !dropOverflow
      ? m + 1
      : autoFit
        ? Math.max(0, timedSlots - 1)
        : timedSlots;
    placeholderAtMore = insertRank >= vis;
    visibleTimed = placeholderAtMore
      ? segments.timed.slice(0, vis)
      : segments.timed.slice(0, Math.max(0, vis - 1));
    placeholderIndex = placeholderAtMore ? -1 : insertRank;
    overflowCount =
      extraHidden + (m - visibleTimed.length) + (placeholderAtMore ? 1 : 0);
  }

  // Faint dashed drop placeholder, tinted to the dragged event's color, echoing
  // the move ghost (EVENT_CALENDAR_GHOST.move); one chip-height tall so chips
  // shift by exactly one row when it is inserted.
  const dropPlaceholder = inlineDrop ? (
    <div
      key="ec-drop-placeholder"
      aria-hidden
      data-slot="event-calendar-drop-placeholder"
      data-drop-invalid={!inlineDrop.valid || undefined}
      className={cn(
        "shrink-0 rounded-sm border border-dashed",
        inlineDrop.valid
          ? "border-(--ec-event-color)/50 bg-(--ec-event-color)/8"
          : "border-destructive/70 bg-destructive/10",
        viewConfig.classNames?.dragGhost,
      )}
      style={
        {
          "--ec-event-color": inlineDrop.color ?? "var(--color-primary)",
          height: "calc(var(--ec-month-bar-h, 1.75rem) - 0.125rem)",
        } as CSSProperties
      }
    />
  ) : null;

  const defaultContent = (
    <>
      <div
        ref={contentRef}
        className={cn(
          // gap-0.5 pairs with the 0.125rem subtraction in the lane spacer
          // below; changing the gap requires renderMonthCell
          // px-1 matches the all-day bar wrapper inset so single-day chips and
          // multi-day bars line up on the same left/right edge in a cell
          "flex min-h-0 flex-1 flex-col gap-0.5 overflow-hidden px-1 pt-1.5",
          viewConfig.classNames?.monthCellContent,
        )}
      >
        {reservedLanes > 0 && (
          <div
            aria-hidden
            className="shrink-0"
            style={{
              // lane height already carries the 2px inter-lane gap; subtract
              // it so spacer + the column's own gap-0.5 = the SAME 2px rhythm
              // between the last bar and the first timed chip
              height: `calc(${reservedLanes} * var(--ec-month-bar-h, 1.75rem) - 0.125rem)`,
            }}
          />
        )}
        {visibleTimed.flatMap((segment, i) => {
          const chip = (
            <EventCalendarEvent
              key={segment.occurrence.key}
              segment={segment}
              // Hold a fixed height like the all-day lane above; without this
              // the chip flex-shrinks to whatever room the cell has left, so
              // cells with a reserved bar lane or a second chip render shorter
              // chips.
              className="shrink-0"
            />
          );
          return i === placeholderIndex ? [dropPlaceholder, chip] : [chip];
        })}
        {placeholderIndex >= 0 &&
          placeholderIndex >= visibleTimed.length &&
          dropPlaceholder}
        {overflowCount > 0 && (
          <EventCalendarMoreIndicator
            day={day}
            count={overflowCount}
            segments={overflowSegments}
            dropInto={
              placeholderAtMore && inlineDrop
                ? { color: inlineDrop.color, valid: inlineDrop.valid }
                : undefined
            }
          />
        )}
      </div>
      {/* Day number + add affordance, bottom-right (Notion-style) */}
      <div
        className={cn(
          "flex items-center justify-end gap-1 px-2 pb-1.5",
          viewConfig.classNames?.monthCellFooter,
        )}
      >
        {viewConfig.showDayAddButton && !isInteracting && (
          <button
            type="button"
            data-slot="event-calendar-day-add"
            aria-label={settings.i18n.labels.addEvent}
            // a different icon/markup is a renderMonthCell job
            className={cn(
              "flex size-5 cursor-pointer items-center justify-center rounded-sm bg-primary text-primary-foreground opacity-0 transition-opacity focus-visible:opacity-100 group-hover/ec-cell:opacity-100",
              viewConfig.classNames?.dayAddButton,
            )}
            onClick={(e) => {
              e.stopPropagation();
              settings.onSlotClick?.(
                { date: day, allDay: true, view: "month" },
                e,
              );
            }}
          >
            <IconPlaceholder
              lucide="PlusIcon"
              tabler="IconPlus"
              hugeicons="PlusSignIcon"
              phosphor="PlusIcon"
              remixicon="RiAddLine"
              className="size-3.5"
              aria-hidden="true"
            />
          </button>
        )}
        <span
          data-slot="event-calendar-month-day-number"
          className={cn(
            "flex size-5 items-center justify-center rounded-full",
            isOutside && "text-muted-foreground",
            // the filled circle already marks today; keep the number the same
            // weight/size as the other days so it does not read as larger
            // Same font-size as every other day; a lighter weight cancels the
            // way white digits on the filled circle read bolder/larger than the
            // dark-on-light numbers around them.
            isToday && "bg-primary font-light text-primary-foreground",
            viewConfig.classNames?.monthDayNumber,
          )}
        >
          {format(
            toZoned(day, settings.timeZone),
            settings.i18n.formats.monthCellDay,
            { locale: settings.locale },
          )}
        </span>
      </div>
    </>
  );

  const content =
    viewConfig.renderMonthCell?.({
      day,
      segments,
      isToday,
      isOutside,
      overflowCount,
      defaultContent,
    }) ?? defaultContent;

  return (
    <div
      role="gridcell"
      data-slot="event-calendar-month-cell"
      data-today={isToday || undefined}
      data-outside={isOutside || undefined}
      data-weekend={
        settings.weekendDays.includes(
          toZoned(day, settings.timeZone).getDay(),
        ) || undefined
      }
      data-ec-day={dayStart.getTime()}
      data-drop-target={isDropTarget ?? undefined}
      data-off={isOff || undefined}
      data-draft={inDraft ? "" : undefined}
      aria-label={format(
        toZoned(day, settings.timeZone),
        settings.i18n.formats.monthCellAriaLabel,
        { locale: settings.locale },
      )}
      className={cn(
        "group/ec-cell relative flex min-h-0 min-w-0 flex-col overflow-hidden",
        !isLast && "border-e",
        isOutside && !settings.showOutsideDays && "invisible",
        isOff && offClassName,
        isToday &&
          cn(
            "relative border-b-2 border-b-primary/40 bg-primary/3",
            viewConfig.todayClassName,
          ),
        viewConfig.dayClassName?.(day),
        // No drop-target bg fill on move/resize - the dragged bar + not-allowed
        // cursor carry the feedback; a cell-wide color wash is too distracting.
        // data-drop-target stays as an opt-in styling hook.
        inDraft && "bg-primary/5",
        viewConfig.classNames?.monthCell,
      )}
      onPointerDown={(e) => {
        const target = e.target as HTMLElement;
        if (target.closest("[data-slot=event-calendar-event]")) return;
        if (target.closest("[data-slot=event-calendar-more]")) return;
        gestures.beginCreate(e, day, true);
      }}
      onClick={(e) => {
        if (wasRecentDrag() || wasRecentChipPress()) return;
        settings.onSlotClick?.({ date: day, allDay: true, view: "month" }, e);
      }}
    >
      {inDraft && (
        <span
          aria-hidden
          data-slot="event-calendar-slot-draft"
          className={cn(
            "pointer-events-none absolute inset-0 z-10 border-primary/40 border-y border-dashed",
            inDraft.isStart && "border-s",
            inDraft.isEnd && "border-e",
            viewConfig.classNames?.slotDraft,
          )}
        />
      )}
      {content}
    </div>
  );
}

interface EventCalendarMoreIndicatorProps {
  day: Date;
  count: number;
  /** The OVERFLOW (hidden) segments for this day - bars first, then timed. The
   *  popover lists only these, never the chips already visible in the cell. */
  segments: EventCalendarSegment[];
  /** Set while a timed chip is dragged and will land in THIS overflow bucket:
   *  the indicator itself becomes the drop placeholder (dashed, event-tinted) so
   *  it reads as "the chip joins the +N more list". */
  dropInto?: { color?: string; valid: boolean };
}

/**
 * "+N more" trigger opening a popover with the day's full event list.
 * onMoreClick returning false suppresses the built-in popover.
 */
function EventCalendarMoreIndicator({
  day,
  count,
  segments,
  dropInto,
}: EventCalendarMoreIndicatorProps) {
  const settings = useEventCalendarSettings();
  const viewConfig = useEventCalendarViewConfig();
  const [open, setOpen] = useState(false);

  // Grabbing a chip from this list starts a drag; close the popover so it does
  // not sit over the drop target while the event is carried to another day.
  const isDragging = useEventCalendarSelector<unknown, boolean>(
    (state) => state.drag !== null,
  );
  useEffect(() => {
    if (isDragging) setOpen(false);
  }, [isDragging]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        data-slot="event-calendar-more"
        data-drop-into={dropInto ? "" : undefined}
        data-drop-invalid={dropInto && !dropInto.valid ? "" : undefined}
        className={cn(
          "cursor-pointer truncate rounded-sm px-1.5 text-start text-muted-foreground hover:text-foreground",
          // While a dragged chip will land in this overflow bucket, the "+N more"
          // link itself becomes the drop placeholder: dashed, event-tinted, one
          // chip tall, so the drop target is unmistakable.
          dropInto &&
            cn(
              "flex shrink-0 items-center border border-dashed",
              dropInto.valid
                ? "border-(--ec-event-color)/50 bg-(--ec-event-color)/8 text-foreground"
                : "border-destructive/70 bg-destructive/10 text-destructive",
            ),
          viewConfig.classNames?.moreIndicator,
        )}
        style={
          dropInto
            ? ({
                "--ec-event-color": dropInto.color ?? "var(--color-primary)",
                height: "calc(var(--ec-month-bar-h, 1.75rem) - 0.125rem)",
              } as CSSProperties)
            : undefined
        }
        onClick={(e: React.MouseEvent) => {
          e.stopPropagation();
          const verdict = settings.onMoreClick?.(
            day,
            segments.map((segment) => segment.occurrence),
            e,
          );
          if (verdict === false) {
            e.preventDefault();
            setOpen(false);
          }
        }}
      >
        {viewConfig.renderMoreIndicator?.({ day, count, segments }) ??
          settings.i18n.labels.more(count)}
      </PopoverTrigger>
      <PopoverContent
        data-slot="event-calendar-more-popover"
        align={viewConfig.morePopoverAlign}
        // PopoverContent is unlayered (flex-col gap-4 p-4); override with !.
        // text-xs re-establishes the calendar's base type here because this
        // content is portaled out of the root subtree and cannot inherit it.
        className={cn(
          "w-64 gap-1! p-2! text-xs",
          viewConfig.classNames?.morePopover,
        )}
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
      >
        {viewConfig.renderMoreContent ? (
          viewConfig.renderMoreContent({
            day,
            segments,
            close: () => setOpen(false),
          })
        ) : (
          <EventCalendarMoreDefaultContent day={day} segments={segments} />
        )}
      </PopoverContent>
    </Popover>
  );
}

/** Built-in "+N more" popover body: day header + the day's chips. */
function EventCalendarMoreDefaultContent({
  day,
  segments,
}: {
  day: Date;
  segments: EventCalendarSegment[];
}) {
  const settings = useEventCalendarSettings();
  const viewConfig = useEventCalendarViewConfig();
  return (
    <>
      <div
        className={cn(
          "px-1 py-1 font-medium text-muted-foreground text-xs",
          viewConfig.classNames?.morePopoverHeader,
        )}
      >
        {format(
          toZoned(day, settings.timeZone),
          settings.i18n.formats.moreDayHeader,
          { locale: settings.locale },
        )}
      </div>
      {/* The scroll region breaks out of the popover's right padding (-me-2)
            so the scrollbar sits flush in the gutter; the list then pads itself
            back (ps-1 aligns with the header, pe-4 clears the ~10px bar with a
            gap) and adds py-1 so the first/last focus ring is not clipped by
            the overflow. Layout is identical with or without a scrollbar. */}
      {viewConfig.scrollbars === "native" ? (
        <div
          data-ec-native-scroll=""
          className="-me-2 max-h-(--ec-more-max-height,16rem) min-h-0 overflow-y-auto"
        >
          <div className="flex flex-col gap-1 py-1 ps-1 pe-4">
            {segments.map((segment) => (
              <EventCalendarEvent
                key={segment.occurrence.key}
                segment={segment}
                className="py-0.5"
              />
            ))}
          </div>
        </div>
      ) : (
        <ScrollArea className="-me-2 min-h-0 **:data-[slot=scroll-area-viewport]:max-h-(--ec-more-max-height,16rem)">
          <div className="flex flex-col gap-1 py-1 ps-1 pe-4">
            {segments.map((segment) => (
              <EventCalendarEvent
                key={segment.occurrence.key}
                segment={segment}
                className="py-0.5"
              />
            ))}
          </div>
        </ScrollArea>
      )}
    </>
  );
}

export { EventCalendarMonthView, EventCalendarMoreIndicator };
export type { EventCalendarMonthViewProps, EventCalendarMoreIndicatorProps };
