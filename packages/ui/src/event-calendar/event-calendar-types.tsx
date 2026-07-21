// Title: Event Calendar Types
// Description: Public TypeScript contract for the headless event calendar: events, occurrences, segments, state, and callbacks.

type EventCalendarEventId = string;

type CalendarView = "month" | "week" | "day" | "days" | "agenda" | "resource";

/**
 * A bookable resource (room, person, equipment). Nesting via children renders
 * with children; the resource day view shows leaves as booking columns.
 */
interface EventCalendarResource {
  id: string;
  title: string;
  /** Token or css color used for subtle row/column accents. */
  color?: string;
  children?: EventCalendarResource[];
}

interface EventCalendarDateRange {
  /** Inclusive instant. */
  start: Date;
  /** Exclusive instant. */
  end: Date;
}

type EventCalendarWeekday = "MO" | "TU" | "WE" | "TH" | "FR" | "SA" | "SU";

interface EventCalendarRecurrenceRule {
  freq: "daily" | "weekly" | "monthly" | "yearly";
  interval?: number;
  count?: number;
  /** Inclusive instant. */
  until?: Date;
  byWeekday?: Array<
    EventCalendarWeekday | { day: EventCalendarWeekday; ordinal: number }
  >;
  byMonthDay?: number[];
  byMonth?: number[];
  weekStart?: EventCalendarWeekday;
  exDates?: Date[];
  rDates?: Date[];
}

interface CalendarEvent<TData = unknown> {
  id: EventCalendarEventId;
  title: string;
  /** Plain instant; consumers parse ISO strings themselves. */
  start: Date;
  /** Exclusive; must be >= start. */
  end: Date;
  allDay?: boolean;
  /** Structured rule or a raw "RRULE:..." line. */
  recurrence?: EventCalendarRecurrenceRule | string;
  /** This event is an edited single occurrence of that series. */
  recurringEventId?: EventCalendarEventId;
  /** Which occurrence it replaces (RECURRENCE-ID semantics). */
  originalStart?: Date;
  /** Token or css color; flows to the --ec-event-color css var. */
  color?: string;
  /** Excluded from drag and resize regardless of interactions state. */
  readOnly?: boolean;
  /** Per-event override; default comes from interactions.drag. */
  draggable?: boolean;
  /** Per-event override; default comes from interactions.resize. */
  resizable?: boolean;
  /** Packing prominence; feeds getEventPriority ordering. */
  priority?: number;
  /** Explicit stacking override; wins over the computed z. */
  zIndex?: number;
  /** Bookable resource this event belongs to (resource view). */
  resourceId?: string;
  /** Consumer payload, fully generic. */
  data?: TData;
}

interface EventCalendarOccurrence<TData = unknown> {
  /** Stable per instance: `${event.id}::${startISO}`. */
  key: string;
  eventId: EventCalendarEventId;
  event: CalendarEvent<TData>;
  start: Date;
  end: Date;
  allDay: boolean;
  isRecurring: boolean;
  recurrenceIndex?: number;
}

interface EventCalendarSegment<TData = unknown> {
  occurrence: EventCalendarOccurrence<TData>;
  /** Zoned day this segment belongs to. */
  day: Date;
  isStart: boolean;
  isEnd: boolean;
  continuesBefore: boolean;
  continuesAfter: boolean;
  /** Timed only: minutes from the zoned day start. */
  startMin?: number;
  endMin?: number;
  /** Month / all-day lane index. */
  lane?: number;
  /** Time-grid overlap packing. */
  column?: number;
  columnCount?: number;
  columnSpan?: number;
  /** Week-row granularity (month bars / all-day lanes). */
  rowIndex?: number;
  colStart?: number;
  colSpan?: number;
}

interface EventCalendarSelection {
  eventKeys: string[];
  /** Committed slot selection; see EventCalendarSlotDraft for the in-gesture value. */
  slot: { start: Date; end: Date; allDay: boolean } | null;
}

interface EventCalendarInteractions {
  drag: boolean;
  resize: boolean;
  selectSlot: boolean;
}

interface EventCalendarDragState<TData = unknown> {
  kind: "move" | "resize-start" | "resize-end";
  occurrence: EventCalendarOccurrence<TData>;
  proposedStart: Date;
  proposedEnd: Date;
  proposedAllDay: boolean;
  /**
   * True when the proposal was resolved on the day-granular surface (month
   * cells / the all-day lane) rather than minute columns - the all-day lane
   * ghost keys on this, covering timed MULTI-DAY bars whose proposals stay
   * timed (proposedAllDay alone misses them).
   */
  proposedDayGranular: boolean;
  /** Target resource when dragging across resource columns/rows. */
  proposedResourceId?: string;
  /** Last canDropEvent verdict; drives data-drop-invalid styling. */
  valid: boolean;
}

/**
 * The in-progress drag-create rectangle ONLY, cleared on commit or cancel.
 * The committed slot selection lives in EventCalendarSelection.slot.
 */
interface EventCalendarSlotDraft {
  start: Date;
  end: Date;
  allDay: boolean;
  view: CalendarView;
  /** Present when the slot was selected inside a resource column/row. */
  resourceId?: string;
}

/**
 * User-adjustable display toggles (the "View settings" submenu). Every field
 * is optional; undefined defers to the matching root view-config prop.
 */
interface EventCalendarViewSettings {
  /** Show Saturday/Sunday columns in month, week, and N-day grids. */
  weekends?: boolean;
  /** Week-number gutter in the month view. */
  weekNumbers?: boolean;
  nowIndicator?: boolean;
  /** Off-day (non-working) background marking. */
  offDays?: boolean;
}

interface EventCalendarState<TData = unknown> {
  view: CalendarView;
  /** Anchor date. */
  date: Date;
  /** For the "days" view. */
  dayCount: number;
  /** Full rendered grid incl. outside days - fetch remote data for THIS. */
  visibleRange: EventCalendarDateRange;
  /** The logical period (the month/week itself). */
  activeRange: EventCalendarDateRange;
  events: CalendarEvent<TData>[];
  selection: EventCalendarSelection;
  interactions: EventCalendarInteractions;
  loading: boolean;
  drag: EventCalendarDragState<TData> | null;
  slotDraft: EventCalendarSlotDraft | null;
  viewSettings: EventCalendarViewSettings;
}

interface EventCalendarRangeInfo {
  range: EventCalendarDateRange;
  activeRange: EventCalendarDateRange;
  view: CalendarView;
  date: Date;
  timeZone: string;
}

interface EventCalendarProposedUpdate<TData = unknown> {
  event: CalendarEvent<TData>;
  /** null when source === "api". */
  occurrence: EventCalendarOccurrence<TData> | null;
  start: Date;
  end: Date;
  allDay: boolean;
  /** Proposed resource when the gesture crossed resource columns/rows. */
  resourceId?: string;
  source: "drag" | "resize-start" | "resize-end" | "keyboard" | "api";
}

/** false = reject/revert; void or true = accept; object = accept with adjustment. */
type EventCalendarUpdateResult =
  | boolean
  | void
  | { start?: Date; end?: Date; allDay?: boolean };

/** A click is a point, not a range; `end` is present for timed slots. */
interface EventCalendarSlotInfo {
  date: Date;
  end?: Date;
  allDay: boolean;
  view: CalendarView;
  /** Present when the click happened inside a resource column/row. */
  resourceId?: string;
}

/**
 * Off-day marking (non-working days). `true` uses the defaults: weekends
 * with a muted background. Custom weekday sets, explicit dates, a predicate,
 * and a custom class are all supported; marked cells carry `data-off` for
 * CSS-selector customization.
 */
interface EventCalendarOffDaysConfig {
  /** Weekday numbers treated as off (0 = Sunday). Default [0, 6]. */
  weekendDays?: number[];
  /** Additional explicit off dates (compared by day in the display zone). */
  dates?: Date[];
  /** Full custom predicate; runs in addition to weekendDays/dates. */
  isOffDay?: (day: Date) => boolean;
  /** Marker classes; default "bg-muted/25". */
  className?: string;
}

/**
 * External-data contract. v1 ships the type plus docs recipes (Google
 * events.list / MS Graph calendarView map to CalendarEvent in ~15 lines);
 * OAuth, tokens, and sync loops are application backend territory.
 */
interface EventCalendarDataAdapter<TData = unknown> {
  getEvents(
    range: EventCalendarDateRange,
    signal?: AbortSignal,
  ): Promise<CalendarEvent<TData>[]>;
}

export type {
  CalendarEvent,
  CalendarView,
  EventCalendarDataAdapter,
  EventCalendarDateRange,
  EventCalendarDragState,
  EventCalendarEventId,
  EventCalendarInteractions,
  EventCalendarOccurrence,
  EventCalendarOffDaysConfig,
  EventCalendarProposedUpdate,
  EventCalendarRangeInfo,
  EventCalendarRecurrenceRule,
  EventCalendarResource,
  EventCalendarSegment,
  EventCalendarSelection,
  EventCalendarSlotDraft,
  EventCalendarSlotInfo,
  EventCalendarState,
  EventCalendarViewSettings,
  EventCalendarUpdateResult,
  EventCalendarWeekday,
};
