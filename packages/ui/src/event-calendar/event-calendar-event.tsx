// Title: Event Calendar Event
// Description: The reusable event chip/bar/block - selection, clicks, drag + resize wiring, and the consumer render slot.

"use client";

import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { addDays, format } from "date-fns";
import type { CSSProperties, ReactNode } from "react";
import { createContext, useContext, useMemo } from "react";
import { cn } from "../lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../tooltip";
import {
  useEventCalendar,
  useEventCalendarSelector,
  useEventCalendarViewConfig,
  useEventCalendarViewContext,
} from "./event-calendar";
import {
  markChipPress,
  useEventCalendarGestures,
  wasRecentDrag,
} from "./event-calendar-dnd";
import {
  spansMultipleDays,
  toZoned,
  zonedStartOfDay,
} from "./event-calendar-lib";
import type {
  EventCalendarOccurrence,
  EventCalendarSegment,
} from "./event-calendar-types";
import { IconPlaceholder } from "./icon-placeholder";

/**
 * Effective Tailwind palette presets for event colors; every entry works on
 * light and dark surfaces through the chip's alpha background + accent border.
 */
const EVENT_CALENDAR_COLORS: Array<{ name: string; value: string }> = [
  { name: "Blue", value: "var(--color-blue-500)" },
  { name: "Emerald", value: "var(--color-emerald-500)" },
  { name: "Violet", value: "var(--color-violet-500)" },
  { name: "Rose", value: "var(--color-rose-500)" },
  { name: "Amber", value: "var(--color-amber-500)" },
  { name: "Cyan", value: "var(--color-cyan-500)" },
  { name: "Orange", value: "var(--color-orange-500)" },
  { name: "Pink", value: "var(--color-pink-500)" },
  { name: "Teal", value: "var(--color-teal-500)" },
  { name: "Indigo", value: "var(--color-indigo-500)" },
];

/**
 * Standardized drag-ghost surface treatment, shared verbatim by every view
 * (month, week/day/N-days, resource). One visual language for interactions:
 * - move: the event is CARRIED FREELY - a cursor-attached full clone (built
 *   by the dnd engine, data-slot=event-calendar-drag-carry) travels with the
 *   pointer; the in-grid ghost is only this faint dashed placeholder marking
 *   the snapped drop slot. The source stays dimmed in place.
 * - resize: the event is STRETCHED - the chip itself at the proposed extent
 *   with a dashed boundary instead of solid (slight indicator, no elevation).
 * - invalid: destructive tint on the placeholder / dashed clone; the engine
 *   adds the not-allowed cursor, a destructive ring on the carry clone, and
 *   a cursor-following validation hint.
 */
const EVENT_CALENDAR_GHOST = {
  move: "rounded-sm border border-dashed border-(--ec-event-color)/50 bg-(--ec-event-color)/8",
  resize:
    "rounded-sm border border-dashed border-(--ec-event-color)/70 overflow-hidden",
  invalid: "border-destructive/70 bg-destructive/10",
  invalidResize: "border-destructive/70",
  /** Applied to the clone inside an invalid resize ghost. */
  invalidContent: "opacity-60",
} as const;

/**
 * Fade-out truncation for stacked timed blocks: squeezed cascade columns
 * hard-clip titles into a mash of adjacent glyphs; a right-edge mask fade
 * reads cleaner than an ellipsis at those tiny widths. The mask applies ONLY
 * below a 10rem container width - mask-image forces text off subpixel
 * antialiasing onto a grayscale raster layer, so masking every wide chip
 * makes the whole grid read bolder/blurry and shimmer while the window
 * resizes. Wide chips keep a plain ellipsis. Consumer renderEvent content
 * can import and reuse it.
 */
const EVENT_CALENDAR_FADE_TRUNCATE =
  "w-full truncate @max-[10rem]:text-clip @max-[10rem]:[mask-image:linear-gradient(to_right,#000_calc(100%-0.75rem),transparent)] @max-[10rem]:rtl:[mask-image:linear-gradient(to_left,#000_calc(100%-0.75rem),transparent)]";

interface EventCalendarChipContextValue<TData = unknown> {
  occurrence: EventCalendarOccurrence<TData>;
  segment: EventCalendarSegment<TData>;
  isDragging: boolean;
  isSelected: boolean;
}

const EventCalendarChipContext =
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  createContext<EventCalendarChipContextValue<any> | null>(null);

/** The chip's subject; usable inside renderEvent content and chip children. */
function useEventCalendarEventChip<
  TData = unknown,
>(): EventCalendarChipContextValue<TData> {
  const ctx = useContext(EventCalendarChipContext);
  if (!ctx) {
    throw new Error(
      "useEventCalendarEventChip must be used within <EventCalendarEvent>",
    );
  }
  return ctx as EventCalendarChipContextValue<TData>;
}

interface EventCalendarEventProps<TData = unknown>
  extends Omit<useRender.ComponentProps<"button">, "children"> {
  segment: EventCalendarSegment<TData>;
  /** Replaces the default chip CONTENT; the wrapper stays calendar-owned. */
  children?: ReactNode;
  /**
   * Static drag clone: renders the chip exactly as-is but inert - no gestures,
   * resize handles, selection/drag state, focus, or pointer events. Used for
   * the full-fidelity ghost that tracks the proposed slot during a move.
   */
  preview?: boolean;
}

/**
 * The one interactive event element used by every view. The wrapper owns
 * positioning hooks, a11y, selection, drag/resize listeners, and data
 * attributes; content comes from children, the root renderEvent override,
 * or the built-in default.
 */
function EventCalendarEvent<TData = unknown>({
  segment,
  className,
  render,
  children,
  preview = false,
  ...props
}: EventCalendarEventProps<TData>) {
  const instance = useEventCalendar<TData>();
  const viewConfig = useEventCalendarViewConfig<TData>();
  const { view } = useEventCalendarViewContext();
  const gestures = useEventCalendarGestures<TData>();
  const { settings } = instance;
  const occurrence = segment.occurrence;
  const event = occurrence.event;

  const isSelectedRaw = useEventCalendarSelector<TData, boolean>(
    (state) => state.selection.eventKeys.includes(occurrence.key),
    { calendar: instance },
  );
  const isDraggingRaw = useEventCalendarSelector<TData, boolean>(
    (state) => state.drag?.occurrence.key === occurrence.key,
    { calendar: instance },
  );
  // reactive, unlike gestures.canResize: api.setInteractions({ resize })
  // must add/remove the handles without waiting for an unrelated re-render
  const resizeOn = useEventCalendarSelector<TData, boolean>(
    (state) => state.interactions.resize,
    { calendar: instance },
  );
  // A preview clone must never inherit the source's selected/dragging state
  // (the drag key matches, which would dim the clone itself).
  const isSelected = preview ? false : isSelectedRaw;
  const isDragging = preview ? false : isDraggingRaw;

  const isBar = occurrence.allDay || spansMultipleDays(occurrence);
  const inTimeGrid =
    view === "week" || view === "day" || view === "days" || view === "resource";
  const interactive = view !== "agenda" && !preview;
  const timedBlock = inTimeGrid && !isBar;
  const horizontalBar = isBar && !inTimeGrid;
  // >= compactEventMinutes renders the stacked (title over time) layout;
  // squeezed cascade columns there fade-truncate instead of hard-clipping
  // into neighbors
  const stackedBlock =
    timedBlock &&
    (segment.endMin ?? 0) - (segment.startMin ?? 0) >=
      viewConfig.compactEventMinutes;

  const defaultContent = (
    <>
      {/* leading color dot for single-row chips (month cells, all-day bars);
          time-grid blocks read their color from the tinted surface instead -
          in the stacked layout a dot would sit alone on the first line */}
      {!timedBlock && (
        <span
          aria-hidden
          data-slot="event-calendar-event-dot"
          // -me-0.5 tightens just the dot-to-title gap (the chip keeps gap-1.5
          // between the title and the trailing time)
          className="-me-0.5 size-1.5 shrink-0 rounded-full bg-(--ec-event-color)"
        />
      )}
      {occurrence.isRecurring && (
        <IconPlaceholder
          lucide="RepeatIcon"
          tabler="IconRepeat"
          hugeicons="RepeatIcon"
          phosphor="RepeatIcon"
          remixicon="RiRepeatLine"
          className="size-2.5 shrink-0 opacity-70"
          aria-hidden="true"
        />
      )}
      <span
        className={cn(
          "font-medium",
          stackedBlock ? EVENT_CALENDAR_FADE_TRUNCATE : "truncate",
        )}
      >
        {event.title}
      </span>
      {/* month cells are narrow: a compact never-shrinking start time keeps
          the title readable; grid views show the full range */}
      {!occurrence.allDay &&
        segment.isStart &&
        (view === "month" ? (
          <span className="shrink-0 text-muted-foreground">
            {format(
              toZoned(occurrence.start, settings.timeZone),
              settings.i18n.formats.eventTime,
              { locale: settings.locale },
            )}
          </span>
        ) : (
          <span
            className={cn(
              "@[8rem]:inline hidden text-muted-foreground",
              stackedBlock ? EVENT_CALENDAR_FADE_TRUNCATE : "truncate",
            )}
          >
            {settings.i18n.functions.formatEventTime(
              toZoned(occurrence.start, settings.timeZone),
              toZoned(occurrence.end, settings.timeZone),
              occurrence.allDay,
            )}
          </span>
        ))}
    </>
  );

  // Agenda time text is per-day for multi-day events: the first day reads
  // "From 9:00 AM", middle days "All day", the last day "Until 5:00 PM".
  // Boundaries derive from the occurrence vs segment.day (never the packing
  // flags - lane merging rewrites those on shared segment objects).
  const agendaTimeText = (() => {
    if (view !== "agenda") return "";
    if (occurrence.allDay) return settings.i18n.labels.allDay;
    const dayStart = zonedStartOfDay(segment.day, settings.timeZone);
    const dayEnd = addDays(toZoned(dayStart, settings.timeZone), 1);
    const startsBefore = occurrence.start < dayStart;
    const endsAfter = occurrence.end > dayEnd;
    if (startsBefore && endsAfter) return settings.i18n.labels.allDay;
    if (endsAfter) {
      return settings.i18n.labels.timeFrom(
        format(
          toZoned(occurrence.start, settings.timeZone),
          settings.i18n.formats.eventTime,
          { locale: settings.locale },
        ),
      );
    }
    if (startsBefore) {
      return settings.i18n.labels.timeUntil(
        format(
          toZoned(occurrence.end, settings.timeZone),
          settings.i18n.formats.eventTime,
          { locale: settings.locale },
        ),
      );
    }
    return settings.i18n.functions.formatEventTime(
      toZoned(occurrence.start, settings.timeZone),
      toZoned(occurrence.end, settings.timeZone),
      false,
    );
  })();

  // Agenda default row: time column, color-dot badge, plain title
  const agendaDefaultContent = (
    <>
      <span className="w-40 shrink-0 truncate text-muted-foreground tabular-nums">
        {agendaTimeText}
      </span>
      <span
        aria-hidden
        data-slot="event-calendar-agenda-dot"
        className="size-2 shrink-0 rounded-full bg-(--ec-event-color)"
      />
      <span className="truncate text-sm">{event.title}</span>
      {occurrence.isRecurring && (
        <IconPlaceholder
          lucide="RepeatIcon"
          tabler="IconRepeat"
          hugeicons="RepeatIcon"
          phosphor="RepeatIcon"
          remixicon="RiRepeatLine"
          className="size-2.5 shrink-0 text-muted-foreground"
          aria-hidden="true"
        />
      )}
    </>
  );

  // Custom chip content is memoized so a drag - which re-renders the lane on
  // every pointer move - never re-invokes the consumer's renderEvent per frame.
  // The element stays referentially stable across those re-renders, so React
  // skips the custom subtree and it doesn't flicker; on drop only the moved
  // chip's inputs change and recompute. Deps are exactly renderProps' inputs
  // plus the render fns (all stable during an internal drag).
  const customContent = useMemo(() => {
    const renderProps = { occurrence, segment, view, isDragging, isSelected };
    return view === "agenda"
      ? viewConfig.renderAgendaEvent?.(renderProps)
      : viewConfig.renderEvent?.(renderProps);
  }, [
    occurrence,
    segment,
    view,
    isDragging,
    isSelected,
    viewConfig.renderAgendaEvent,
    viewConfig.renderEvent,
  ]);
  const content =
    children ??
    customContent ??
    (view === "agenda" ? agendaDefaultContent : defaultContent);

  const timeLabel = settings.i18n.functions.formatEventTime(
    toZoned(occurrence.start, settings.timeZone),
    toZoned(occurrence.end, settings.timeZone),
    occurrence.allDay,
  );
  // native hover tooltip text; a consumer formatter returning undefined
  // drops the title attribute entirely (e.g. when it renders its own tooltip)
  const label = settings.i18n.functions.formatEventLabel
    ? settings.i18n.functions.formatEventLabel(event.title, timeLabel)
    : `${event.title}, ${timeLabel}`;

  // Optional styled tooltip on hover / keyboard focus (viewConfig.eventTooltip,
  // default off). When on, the native title is dropped so the two never stack;
  // a preview clone never gets one. Content defaults to the label and can be
  // overridden with renderEventTooltip - a falsy result (null/undefined, or
  // the `false`/"" that `cond && <node>` yields) falls back to the label, and
  // an empty label (i18n opt-out) leaves no content so the tooltip is skipped.
  const tooltipOpts =
    typeof viewConfig.eventTooltip === "object"
      ? viewConfig.eventTooltip
      : null;
  const tooltipContent =
    !preview && viewConfig.eventTooltip
      ? viewConfig.renderEventTooltip?.({
          occurrence,
          segment,
          view,
          label,
        }) || label
      : null;
  const tooltipOn = Boolean(tooltipContent);

  const showResize =
    interactive && resizeOn && !event.readOnly && event.resizable !== false;
  // Hover grip pill (mirrors the gantt bars): a tiny bar inside each resize
  // handle signals the direction. Shown on every resizable chip - compact
  // sub-compactEventMinutes timed blocks included - because the chip
  // min-height (1.5rem) leaves room at the very top/bottom edges without
  // colliding with the vertically-centered title.
  const grip = (
    <span
      aria-hidden
      data-slot="event-calendar-resize-grip"
      className={cn(
        "rounded-full bg-foreground/40",
        timedBlock ? "h-0.5 w-2.5" : "h-2.5 w-0.5",
        viewConfig.classNames?.resizeGrip,
      )}
    />
  );
  const resizeHandles = showResize && (
    <>
      {timedBlock && segment.isStart && (
        <span
          data-slot="event-calendar-resize-handle"
          data-edge="start"
          className={cn(
            "absolute inset-x-1 top-0 flex h-1.5 cursor-ns-resize items-center justify-center opacity-0 transition-opacity duration-150 group-hover/ec-event:opacity-100",
            viewConfig.classNames?.resizeHandle,
          )}
          onPointerDown={(e) => gestures.beginResize(e, segment, "start")}
        >
          {grip}
        </span>
      )}
      {timedBlock && segment.isEnd && (
        <span
          data-slot="event-calendar-resize-handle"
          data-edge="end"
          className={cn(
            "absolute inset-x-1 bottom-0 flex h-1.5 cursor-ns-resize items-center justify-center opacity-0 transition-opacity duration-150 group-hover/ec-event:opacity-100",
            viewConfig.classNames?.resizeHandle,
          )}
          onPointerDown={(e) => gestures.beginResize(e, segment, "end")}
        >
          {grip}
        </span>
      )}
      {(horizontalBar || (isBar && inTimeGrid)) && segment.isStart && (
        <span
          data-slot="event-calendar-resize-handle"
          data-edge="start"
          className={cn(
            "absolute inset-y-0 start-0 flex w-2 cursor-ew-resize items-center justify-center opacity-0 transition-opacity duration-150 group-hover/ec-event:opacity-100",
            viewConfig.classNames?.resizeHandle,
          )}
          onPointerDown={(e) => gestures.beginResize(e, segment, "start")}
        >
          {grip}
        </span>
      )}
      {(horizontalBar || (isBar && inTimeGrid)) && segment.isEnd && (
        <span
          data-slot="event-calendar-resize-handle"
          data-edge="end"
          className={cn(
            "absolute inset-y-0 end-0 flex w-2 cursor-ew-resize items-center justify-center opacity-0 transition-opacity duration-150 group-hover/ec-event:opacity-100",
            viewConfig.classNames?.resizeHandle,
          )}
          onPointerDown={(e) => gestures.beginResize(e, segment, "end")}
        >
          {grip}
        </span>
      )}
    </>
  );

  const defaultProps = {
    type: "button" as const,
    "data-slot": "event-calendar-event",
    "data-view": view,
    "data-all-day": occurrence.allDay || undefined,
    "data-recurring": occurrence.isRecurring || undefined,
    "data-selected": isSelected || undefined,
    "data-dragging": isDragging || undefined,
    "data-preview": preview || undefined,
    "data-past": occurrence.end.getTime() < Date.now() || undefined,
    // native hover reveal for squeezed/faded chips: full title + time (dropped
    // when the styled eventTooltip is on so the two never stack)
    title: preview || tooltipOn ? undefined : label,
    "aria-label":
      settings.i18n.functions.formatEventAriaLabel?.(
        event.title,
        timeLabel,
        segment.continuesBefore || segment.continuesAfter,
      ) ??
      `${event.title}, ${timeLabel}${
        segment.continuesBefore || segment.continuesAfter
          ? `, ${settings.i18n.labels.continues}`
          : ""
      }`,
    "aria-hidden": preview || undefined,
    tabIndex: preview ? -1 : undefined,
    style: {
      "--ec-event-color": event.color ?? "var(--color-primary)",
    } as CSSProperties,
    onPointerDown: (e: React.PointerEvent) => {
      e.stopPropagation();
      // suppress the trailing slot-create click if this press does not turn
      // into a drag (e.g. a locked chip) - see markChipPress
      markChipPress();
      if (interactive) gestures.beginMove(e, segment);
    },
    onClick: (e: React.MouseEvent) => {
      e.stopPropagation();
      if (wasRecentDrag()) return;
      // consumer first: e.preventDefault() opts out of built-in selection
      // (e.g. click = open dialog only, no selected tint)
      settings.onEventClick?.(occurrence, e);
      // the agenda is a read-only list: a click never selects/focuses a row
      if (e.defaultPrevented || view === "agenda") return;
      instance.api.selectEvent(occurrence.key);
    },
    onDoubleClick: (e: React.MouseEvent) => {
      e.stopPropagation();
      settings.onEventDoubleClick?.(occurrence, e);
    },
    className: cn(
      "group/ec-event relative flex w-full min-w-0 cursor-pointer touch-none select-none items-center overflow-hidden text-start text-foreground",
      "outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
      preview && "pointer-events-none",
      view === "agenda"
        ? // plain list row: color lives in the dot badge, not a tinted pill;
          // hover AND selection surfaces are owned by the agenda row wrapper
          "gap-3 rounded-md text-sm"
        : cn(
            // @container removes intrinsic sizing; only grid chips are containers
            // py-1: room above/below inline badges (attendee pill etc.)
            "@container gap-1.5 rounded px-1.5 py-1 leading-normal",
            // soft tint + hairline inset ring: color reads from the surface
            // itself (no accent border), stays legible in light and dark
            "bg-(--ec-event-color)/15 hover:bg-(--ec-event-color)/25",
            // a flat tint reads darker over a dark surface, so lift it a little
            // in dark mode to keep a lighter, softer chip tone
            "dark:bg-(--ec-event-color)/20 dark:hover:bg-(--ec-event-color)/30",
            "inset-ring inset-ring-(--ec-event-color)/15",
            "transition-[background-color,box-shadow] duration-150",
            "data-dragging:opacity-40",
            "data-selected:inset-ring-(--ec-event-color)/40 data-selected:bg-(--ec-event-color)/30",
            segment.continuesBefore && "rounded-s-none",
            segment.continuesAfter && "rounded-e-none",
          ),
      viewConfig.classNames?.event,
      className,
    ),
    children: (
      <>
        {content}
        {resizeHandles}
      </>
    ),
  };

  const chip = useRender({
    defaultTagName: "button",
    render,
    props: mergeProps<"button">(defaultProps, props),
  });

  return (
    <EventCalendarChipContext.Provider
      value={{ occurrence, segment, isDragging, isSelected }}
    >
      {tooltipOn ? (
        <TooltipProvider delay={tooltipOpts?.delay ?? 600}>
          <Tooltip>
            <TooltipTrigger render={chip} />
            <TooltipContent
              side={tooltipOpts?.side ?? "top"}
              className={viewConfig.classNames?.eventTooltip}
            >
              {tooltipContent}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ) : (
        chip
      )}
    </EventCalendarChipContext.Provider>
  );
}

export {
  EVENT_CALENDAR_COLORS,
  EVENT_CALENDAR_FADE_TRUNCATE,
  EVENT_CALENDAR_GHOST,
  EventCalendarEvent,
  useEventCalendarEventChip,
};
export type { EventCalendarChipContextValue, EventCalendarEventProps };
