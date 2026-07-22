// Title: Event Calendar
// Description: Headless-first event calendar with month, week, day, N-day and agenda views, external CRUD contract, and a subscribable store.

"use client";

import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import type { Locale } from "date-fns";
import { addDays } from "date-fns";
import type { ComponentType, ReactNode, RefObject } from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import type { ButtonProps } from "../button";
import { cn } from "../lib/utils";
import type { EventCalendarI18nConfig } from "./event-calendar-i18n";
import { mergeEventCalendarI18n } from "./event-calendar-i18n";
import type {
  EventCalendarDayBucket,
  EventCalendarIndex,
  WeekStartsOn,
} from "./event-calendar-lib";
import {
  buildEventIndex,
  defaultEventOrder,
  eventsOverlap,
  getDayKey,
  getRangeKey,
  getViewDateRange,
  stepDate,
  toZoned,
  zonedStartOfDay,
} from "./event-calendar-lib";
import type {
  CalendarEvent,
  CalendarView,
  EventCalendarDateRange,
  EventCalendarDragState,
  EventCalendarEventId,
  EventCalendarInteractions,
  EventCalendarOccurrence,
  EventCalendarOffDaysConfig,
  EventCalendarProposedUpdate,
  EventCalendarRangeInfo,
  EventCalendarResource,
  EventCalendarSegment,
  EventCalendarSelection,
  EventCalendarSlotDraft,
  EventCalendarSlotInfo,
  EventCalendarState,
  EventCalendarUpdateResult,
  EventCalendarViewSettings,
} from "./event-calendar-types";

const BASE_VIEWS: CalendarView[] = ["month", "week", "day", "days", "agenda"];
const ALL_VIEWS: CalendarView[] = [...BASE_VIEWS, "resource"];

const DEFAULT_INTERACTIONS: EventCalendarInteractions = {
  drag: true,
  resize: true,
  selectSlot: true,
};

const EMPTY_SELECTION: EventCalendarSelection = { eventKeys: [], slot: null };

interface EventCalendarCallbacks<TData = unknown> {
  onEventClick?: (
    occurrence: EventCalendarOccurrence<TData>,
    e: React.MouseEvent,
  ) => void;
  onEventDoubleClick?: (
    occurrence: EventCalendarOccurrence<TData>,
    e: React.MouseEvent,
  ) => void;
  onEventUpdate?: (
    update: EventCalendarProposedUpdate<TData>,
  ) => EventCalendarUpdateResult;
  canDropEvent?: (update: EventCalendarProposedUpdate<TData>) => boolean;
  /**
   * A move/resize was attempted on an event that cannot be dragged (readOnly,
   * per-event draggable/resizable false, or the interaction is off). Fires once
   * per gesture when the pointer crosses the activation threshold; the calendar
   * shows a not-allowed cursor for the duration but never picks the message -
   * broadcast it here so the consumer can surface a custom one.
   */
  onDragBlocked?: (
    occurrence: EventCalendarOccurrence<TData>,
    info: {
      gesture: "move" | "resize";
      reason: "readOnly" | "disabled" | "interactions-off";
    },
  ) => void;
  onSlotClick?: (slot: EventCalendarSlotInfo, e: React.MouseEvent) => void;
  onSelectSlot?: (slot: EventCalendarSlotDraft) => void;
  canSelectSlot?: (slot: EventCalendarSlotDraft) => boolean;
  onRangeChange?: (info: EventCalendarRangeInfo) => void;
  onViewChange?: (view: CalendarView) => void;
  onDateChange?: (date: Date) => void;
  onDayCountChange?: (count: number) => void;
  onSelectionChange?: (selection: EventCalendarSelection) => void;
  onInteractionsChange?: (interactions: EventCalendarInteractions) => void;
  onViewSettingsChange?: (viewSettings: EventCalendarViewSettings) => void;
  onEventsChange?: (events: CalendarEvent<TData>[]) => void;
  onMoreClick?: (
    day: Date,
    segments: EventCalendarOccurrence<TData>[],
    e: React.MouseEvent,
  ) => void | false;
}

interface UseEventCalendarStateOptions<TData = unknown>
  extends EventCalendarCallbacks<TData> {
  events?: CalendarEvent<TData>[];
  defaultEvents?: CalendarEvent<TData>[];
  view?: CalendarView;
  defaultView?: CalendarView;
  date?: Date;
  defaultDate?: Date;
  dayCount?: number;
  defaultDayCount?: number;
  selection?: EventCalendarSelection;
  defaultSelection?: EventCalendarSelection;
  interactions?: Partial<EventCalendarInteractions>;
  defaultInteractions?: Partial<EventCalendarInteractions>;
  viewSettings?: EventCalendarViewSettings;
  defaultViewSettings?: EventCalendarViewSettings;
  loading?: boolean;
  views?: CalendarView[];
  timeZone?: string;
  locale?: Locale;
  weekStartsOn?: WeekStartsOn;
  dayStartHour?: number;
  dayEndHour?: number;
  slotDuration?: number;
  snapDuration?: number;
  agendaDayCount?: number;
  fixedWeeks?: boolean;
  showOutsideDays?: boolean;
  i18n?: Partial<EventCalendarI18nConfig>;
  /** Bookable resources for the resource view. */
  resources?: EventCalendarResource[];
  getEventPriority?: (event: CalendarEvent<TData>) => number;
  eventOrder?: (
    a: EventCalendarOccurrence<TData>,
    b: EventCalendarOccurrence<TData>,
  ) => number;
  getOccurrences?: (
    event: CalendarEvent<TData>,
    range: EventCalendarDateRange,
    ctx: { timeZone: string },
  ) => Array<{ start: Date; end: Date }> | null;
  /**
   * Weekday numbers (0 = Sunday) treated as the weekend by the "weekends"
   * view toggle. @default [0, 6]
   */
  weekendDays?: number[];
  /** Pointer-gesture tuning (activation distances, touch delay, autoscroll). */
  activation?: Partial<EventCalendarActivationConfig>;
}

interface EventCalendarActivationConfig {
  moveDistancePx: number;
  createDistancePx: number;
  touchDelayMs: number;
  touchTolerancePx: number;
  autoScrollEdgePx: number;
  autoScrollMaxStepPx: number;
}

/**
 * Resolved configuration: every UseEventCalendarStateOptions field except the
 * controlled/uncontrolled state pairs, with defaults applied and i18n merged.
 * Read via ref semantics - callback identity changes never re-render the grid.
 */
interface EventCalendarSettings<TData = unknown>
  extends EventCalendarCallbacks<TData> {
  timeZone: string;
  locale?: Locale;
  weekStartsOn: WeekStartsOn;
  views: CalendarView[];
  dayStartHour: number;
  dayEndHour: number;
  slotDuration: number;
  snapDuration: number;
  agendaDayCount: number;
  fixedWeeks: boolean;
  showOutsideDays: boolean;
  i18n: EventCalendarI18nConfig;
  resources: EventCalendarResource[];
  weekendDays: number[];
  activation?: Partial<EventCalendarActivationConfig>;
  getEventPriority: (event: CalendarEvent<TData>) => number;
  eventOrder: (
    a: EventCalendarOccurrence<TData>,
    b: EventCalendarOccurrence<TData>,
  ) => number;
  getOccurrences?: (
    event: CalendarEvent<TData>,
    range: EventCalendarDateRange,
    ctx: { timeZone: string },
  ) => Array<{ start: Date; end: Date }> | null;
}

interface EventCalendarApi<TData = unknown> {
  next(): void;
  prev(): void;
  today(): void;
  goTo(date: Date): void;
  setView(view: CalendarView, opts?: { dayCount?: number }): void;
  setDayCount(count: number): void;
  getEvents(): CalendarEvent<TData>[];
  getEvent(id: EventCalendarEventId): CalendarEvent<TData> | undefined;
  setEvents(events: CalendarEvent<TData>[]): void;
  addEvent(event: CalendarEvent<TData>): void;
  updateEvent(
    id: EventCalendarEventId,
    patch: Partial<CalendarEvent<TData>>,
  ): void;
  removeEvent(id: EventCalendarEventId): void;
  getOccurrences(
    range?: EventCalendarDateRange,
  ): EventCalendarOccurrence<TData>[];
  getOccurrencesForDay(day: Date): EventCalendarOccurrence<TData>[];
  findOverlapping(candidate: {
    start: Date;
    end: Date;
    excludeEventId?: string;
  }): EventCalendarOccurrence<TData>[];
  select(selection: Partial<EventCalendarSelection>): void;
  selectEvent(key: string, opts?: { additive?: boolean }): void;
  clearSelection(): void;
  setInteractions(patch: Partial<EventCalendarInteractions>): void;
  setViewSettings(patch: EventCalendarViewSettings): void;
  getVisibleRange(): EventCalendarDateRange;
  getActiveRange(): EventCalendarDateRange;
  /** TZDate in the calendar's display time zone. */
  toZoned(date: Date): Date;
  /** number = minutes from the zoned day start; no-op outside time-grid views. */
  scrollToTime(time: Date | number): void;
}

/** Cross-file plumbing for sibling view/interaction modules; not public API. */
interface EventCalendarInternals<TData = unknown> {
  getIndex(): EventCalendarIndex<TData>;
  setDrag(drag: EventCalendarDragState<TData> | null): void;
  setSlotDraft(draft: EventCalendarSlotDraft | null): void;
  registerScrollHandler(handler: ((time: Date | number) => void) | null): void;
  applyProposedUpdate(
    update: EventCalendarProposedUpdate<TData>,
    extraPatch?: Partial<CalendarEvent<TData>>,
  ): boolean;
  getSettingsVersion(): number;
  /** The rendered calendar root element, or null before mount. */
  getRootEl(): HTMLElement | null;
  setRootEl(el: HTMLElement | null): void;
}

interface EventCalendarInstance<TData = unknown> {
  getState(): EventCalendarState<TData>;
  subscribe(listener: () => void): () => void;
  api: EventCalendarApi<TData>;
  settings: EventCalendarSettings<TData>;
  internals: EventCalendarInternals<TData>;
}

function resolveSettings<TData>(
  options: UseEventCalendarStateOptions<TData>,
): EventCalendarSettings<TData> {
  const {
    // strip state pairs; the rest flows into settings
    events: _e,
    defaultEvents: _de,
    view: _v,
    defaultView: _dv,
    date: _d,
    defaultDate: _dd,
    dayCount: _dc,
    defaultDayCount: _ddc,
    selection: _s,
    defaultSelection: _ds,
    interactions: _i,
    defaultInteractions: _di,
    viewSettings: _vs,
    defaultViewSettings: _dvs,
    loading: _l,
    ...rest
  } = options;
  return {
    ...rest,
    timeZone:
      options.timeZone ?? Intl.DateTimeFormat().resolvedOptions().timeZone,
    locale: options.locale,
    weekStartsOn: options.weekStartsOn ?? 0,
    // the resource view only makes sense with resources configured
    views:
      options.views ?? (options.resources?.length ? ALL_VIEWS : BASE_VIEWS),
    dayStartHour: options.dayStartHour ?? 0,
    dayEndHour: options.dayEndHour ?? 24,
    slotDuration: options.slotDuration ?? 30,
    snapDuration: options.snapDuration ?? 15,
    agendaDayCount: options.agendaDayCount ?? 30,
    fixedWeeks: options.fixedWeeks ?? true,
    showOutsideDays: options.showOutsideDays ?? true,
    i18n: mergeEventCalendarI18n(options.i18n),
    resources: options.resources ?? [],
    getEventPriority:
      options.getEventPriority ?? ((event) => event.priority ?? 0),
    eventOrder: options.eventOrder ?? defaultEventOrder,
    getOccurrences: options.getOccurrences,
    weekendDays: options.weekendDays ?? [0, 6],
    activation: options.activation,
  };
}

const warned = new Set<string>();
function warnOnce(key: string, message: string) {
  if (process.env.NODE_ENV !== "production" && !warned.has(key)) {
    warned.add(key);
    console.warn(`[event-calendar] ${message}`);
  }
}

interface EventCalendarStore<TData> {
  instance: EventCalendarInstance<TData>;
  setOptions(next: UseEventCalendarStateOptions<TData>): boolean;
  notify(): void;
  emitRangeIfChanged(): void;
}

function createEventCalendarStore<TData>(
  initial: UseEventCalendarStateOptions<TData>,
): EventCalendarStore<TData> {
  let options = initial;
  let settings = resolveSettings(initial);
  let settingsVersion = 0;

  const listeners = new Set<() => void>();

  const resolveView = (view: CalendarView): CalendarView => {
    if (settings.views.includes(view)) return view;
    const fallback = settings.views[0] ?? "month";
    warnOnce(
      `view-${view}`,
      `view "${view}" is not in views [${settings.views.join(", ")}]; falling back to "${fallback}".`,
    );
    return fallback;
  };

  const internal = {
    view: resolveView(initial.defaultView ?? "month"),
    date: initial.defaultDate ?? new Date(),
    dayCount: initial.defaultDayCount ?? 3,
    events: initial.defaultEvents ?? [],
    selection: initial.defaultSelection ?? EMPTY_SELECTION,
    interactions: { ...DEFAULT_INTERACTIONS, ...initial.defaultInteractions },
    viewSettings: initial.defaultViewSettings ?? {},
    drag: null as EventCalendarDragState<TData> | null,
    slotDraft: null as EventCalendarSlotDraft | null,
  };

  let snapshot: EventCalendarState<TData> | null = null;
  let indexCache: {
    events: CalendarEvent<TData>[];
    rangeKey: string;
    timeZone: string;
    weekStartsOn: WeekStartsOn;
    index: EventCalendarIndex<TData>;
  } | null = null;
  let scrollHandler: ((time: Date | number) => void) | null = null;
  // The rendered calendar root element, registered by the <EventCalendar> host.
  // The drag engine falls back to it to find day cells when a gesture starts
  // from a portaled surface (e.g. a chip inside the "+N more" popover), whose
  // DOM ancestors do not include the calendar.
  let rootEl: HTMLElement | null = null;
  let lastEmittedRangeKey: string | null = null;

  // Controlled interactions merge, cached on input identity: rebuilding the
  // merged object per snapshot would break Object.is for selector hooks.
  let interactionsCache: {
    input: Partial<EventCalendarInteractions>;
    merged: EventCalendarInteractions;
  } | null = null;
  const mergedInteractions = (
    input: Partial<EventCalendarInteractions>,
  ): EventCalendarInteractions => {
    if (interactionsCache?.input !== input) {
      interactionsCache = {
        input,
        merged: { ...DEFAULT_INTERACTIONS, ...input },
      };
    }
    return interactionsCache.merged;
  };

  const invalidate = () => {
    snapshot = null;
  };

  const notify = () => {
    listeners.forEach((listener) => listener());
    emitRangeIfChanged();
  };

  const getState = (): EventCalendarState<TData> => {
    if (snapshot) return snapshot;
    const view = resolveView(options.view ?? internal.view);
    const date = options.date ?? internal.date;
    const dayCount = Math.max(1, options.dayCount ?? internal.dayCount);
    const { visibleRange, activeRange } = getViewDateRange(view, date, {
      timeZone: settings.timeZone,
      weekStartsOn: settings.weekStartsOn,
      dayCount,
      agendaDayCount: settings.agendaDayCount,
      fixedWeeks: settings.fixedWeeks,
    });
    snapshot = {
      view,
      date,
      dayCount,
      visibleRange,
      activeRange,
      events: options.events ?? internal.events,
      selection: options.selection ?? internal.selection,
      interactions: options.interactions
        ? mergedInteractions(options.interactions)
        : internal.interactions,
      loading: options.loading ?? false,
      drag: internal.drag,
      slotDraft: internal.slotDraft,
      viewSettings: options.viewSettings ?? internal.viewSettings,
    };
    return snapshot;
  };

  const emitRangeIfChanged = () => {
    if (!settings.onRangeChange) return;
    const state = getState();
    const key = `${state.view}:${getRangeKey(state.visibleRange)}:${settings.timeZone}`;
    if (key === lastEmittedRangeKey) return;
    lastEmittedRangeKey = key;
    settings.onRangeChange({
      range: state.visibleRange,
      activeRange: state.activeRange,
      view: state.view,
      date: state.date,
      timeZone: settings.timeZone,
    });
  };

  type ControlledKey =
    | "view"
    | "date"
    | "dayCount"
    | "events"
    | "selection"
    | "interactions"
    | "viewSettings";

  const setField = <K extends ControlledKey>(
    key: K,
    value: EventCalendarState<TData>[K extends "events" ? "events" : K],
  ) => {
    const controlled = options[key] !== undefined;
    if (!controlled) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (internal as any)[key] = value;
      invalidate();
    }
    const callbacks: Record<ControlledKey, ((v: never) => void) | undefined> = {
      view: settings.onViewChange as never,
      date: settings.onDateChange as never,
      dayCount: settings.onDayCountChange as never,
      events: settings.onEventsChange as never,
      selection: settings.onSelectionChange as never,
      interactions: settings.onInteractionsChange as never,
      viewSettings: settings.onViewSettingsChange as never,
    };
    callbacks[key]?.(value as never);
    if (!controlled) notify();
  };

  // extraPatch: non-timing fields committed in the SAME write. Two sequential
  // setField("events") calls break controlled mode - the second one re-reads
  // the still-stale controlled array and its onEventsChange payload silently
  // reverts the timing change the first one emitted.
  const applyProposedUpdate = (
    update: EventCalendarProposedUpdate<TData>,
    extraPatch?: Partial<CalendarEvent<TData>>,
  ): boolean => {
    const result = settings.onEventUpdate?.(update);
    if (result === false) return false;
    const adjusted: Partial<CalendarEvent<TData>> =
      result && typeof result === "object"
        ? {
            start: result.start ?? update.start,
            end: result.end ?? update.end,
            allDay: result.allDay ?? update.allDay,
          }
        : { start: update.start, end: update.end, allDay: update.allDay };
    if (update.resourceId !== undefined)
      adjusted.resourceId = update.resourceId;
    const events = getState().events;
    const next = events.map((event) =>
      event.id === update.event.id
        ? { ...event, ...extraPatch, ...adjusted }
        : event,
    );
    setField("events", next);
    return true;
  };

  const getIndex = (): EventCalendarIndex<TData> => {
    const state = getState();
    const rangeKey = getRangeKey(state.visibleRange);
    if (
      indexCache &&
      indexCache.events === state.events &&
      indexCache.rangeKey === rangeKey &&
      indexCache.timeZone === settings.timeZone &&
      indexCache.weekStartsOn === settings.weekStartsOn
    ) {
      return indexCache.index;
    }
    const index = buildEventIndex(state.events, state.visibleRange, {
      timeZone: settings.timeZone,
      weekStartsOn: settings.weekStartsOn,
      eventOrder: settings.eventOrder,
      getOccurrences: settings.getOccurrences,
    });
    indexCache = {
      events: state.events,
      rangeKey,
      timeZone: settings.timeZone,
      weekStartsOn: settings.weekStartsOn,
      index,
    };
    return index;
  };

  const api: EventCalendarApi<TData> = {
    next() {
      const state = getState();
      setField(
        "date",
        stepDate(state.view, state.date, 1, {
          timeZone: settings.timeZone,
          dayCount: state.dayCount,
          agendaDayCount: settings.agendaDayCount,
        }),
      );
    },
    prev() {
      const state = getState();
      setField(
        "date",
        stepDate(state.view, state.date, -1, {
          timeZone: settings.timeZone,
          dayCount: state.dayCount,
          agendaDayCount: settings.agendaDayCount,
        }),
      );
    },
    today() {
      setField("date", new Date());
    },
    goTo(date) {
      setField("date", date);
    },
    setView(view, opts) {
      if (opts?.dayCount !== undefined) {
        setField("dayCount", Math.max(1, opts.dayCount));
      }
      setField("view", resolveView(view));
    },
    setDayCount(count) {
      setField("dayCount", Math.max(1, count));
    },
    getEvents() {
      return getState().events;
    },
    getEvent(id) {
      return getState().events.find((event) => event.id === id);
    },
    setEvents(events) {
      setField("events", events);
    },
    addEvent(event) {
      setField("events", [...getState().events, event]);
    },
    updateEvent(id, patch) {
      const event = api.getEvent(id);
      if (!event) return;
      const merged = { ...event, ...patch };
      const timingChanged =
        patch.start !== undefined ||
        patch.end !== undefined ||
        patch.allDay !== undefined;
      if (timingChanged && settings.onEventUpdate) {
        // single write: the non-timing rest rides along as extraPatch so
        // controlled mode sees one consistent onEventsChange payload
        const rest = { ...patch };
        delete rest.start;
        delete rest.end;
        delete rest.allDay;
        applyProposedUpdate(
          {
            event: merged,
            occurrence: null,
            start: merged.start,
            end: merged.end,
            allDay: merged.allDay ?? false,
            source: "api",
          },
          rest,
        );
        return;
      }
      setField(
        "events",
        getState().events.map((e) => (e.id === id ? merged : e)),
      );
    },
    removeEvent(id) {
      setField(
        "events",
        getState().events.filter((event) => event.id !== id),
      );
    },
    getOccurrences(range) {
      if (!range) return getIndex().occurrences;
      const state = getState();
      const within =
        range.start >= state.visibleRange.start &&
        range.end <= state.visibleRange.end;
      if (within) {
        return getIndex().occurrences.filter((occ) =>
          eventsOverlap(occ, range),
        );
      }
      return buildEventIndex(state.events, range, {
        timeZone: settings.timeZone,
        weekStartsOn: settings.weekStartsOn,
        eventOrder: settings.eventOrder,
        getOccurrences: settings.getOccurrences,
      }).occurrences;
    },
    getOccurrencesForDay(day) {
      const bucket = getIndex().byDay.get(getDayKey(day, settings.timeZone));
      if (!bucket) return [];
      const seen = new Set<string>();
      const result: EventCalendarOccurrence<TData>[] = [];
      for (const seg of [...bucket.allDay, ...bucket.timed]) {
        if (seen.has(seg.occurrence.key)) continue;
        seen.add(seg.occurrence.key);
        result.push(seg.occurrence);
      }
      return result;
    },
    findOverlapping({ start, end, excludeEventId }) {
      return api
        .getOccurrences({ start, end })
        .filter((occ) => occ.eventId !== excludeEventId);
    },
    select(partial) {
      const current = getState().selection;
      setField("selection", {
        eventKeys: partial.eventKeys ?? current.eventKeys,
        slot: partial.slot !== undefined ? partial.slot : current.slot,
      });
    },
    selectEvent(key, opts) {
      const current = getState().selection;
      const eventKeys = opts?.additive
        ? current.eventKeys.includes(key)
          ? current.eventKeys.filter((k) => k !== key)
          : [...current.eventKeys, key]
        : [key];
      setField("selection", { ...current, eventKeys });
    },
    clearSelection() {
      setField("selection", EMPTY_SELECTION);
    },
    setInteractions(patch) {
      setField("interactions", { ...getState().interactions, ...patch });
    },
    setViewSettings(patch) {
      setField("viewSettings", { ...getState().viewSettings, ...patch });
    },
    getVisibleRange() {
      return getState().visibleRange;
    },
    getActiveRange() {
      return getState().activeRange;
    },
    toZoned(date) {
      return toZoned(date, settings.timeZone);
    },
    scrollToTime(time) {
      scrollHandler?.(time);
    },
  };

  const internals: EventCalendarInternals<TData> = {
    getIndex,
    setDrag(drag) {
      internal.drag = drag;
      invalidate();
      notify();
    },
    setSlotDraft(draft) {
      internal.slotDraft = draft;
      invalidate();
      notify();
    },
    registerScrollHandler(handler) {
      scrollHandler = handler;
    },
    applyProposedUpdate,
    getSettingsVersion() {
      return settingsVersion;
    },
    getRootEl() {
      return rootEl;
    },
    setRootEl(el) {
      rootEl = el;
    },
  };

  const instance: EventCalendarInstance<TData> = {
    getState,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    api,
    get settings() {
      return settings;
    },
    internals,
  };

  const STATE_KEYS = [
    "events",
    "view",
    "date",
    "dayCount",
    "selection",
    "interactions",
    "viewSettings",
    "loading",
  ] as const;
  const SETTINGS_KEYS = [
    "timeZone",
    "locale",
    "weekStartsOn",
    "views",
    "dayStartHour",
    "dayEndHour",
    "slotDuration",
    "snapDuration",
    "agendaDayCount",
    "fixedWeeks",
    "showOutsideDays",
    "i18n",
    "resources",
    "getEventPriority",
    "eventOrder",
    "getOccurrences",
  ] as const;

  return {
    instance,
    setOptions(next) {
      const prev = options;
      options = next;
      let changed = false;
      for (const key of STATE_KEYS) {
        if (prev[key] !== next[key]) {
          changed = true;
          break;
        }
      }
      let settingsChanged = false;
      for (const key of SETTINGS_KEYS) {
        if (prev[key] !== next[key]) {
          settingsChanged = true;
          break;
        }
      }
      settings = resolveSettings(next);
      if (settingsChanged) {
        settingsVersion++;
        changed = true;
      }
      if (changed) invalidate();
      return changed;
    },
    notify,
    emitRangeIfChanged,
  };
}

/**
 * Headless root hook - the full calendar engine without any markup.
 * Pass the returned instance to <EventCalendar calendar={instance}> or drive
 * fully custom UI from instance.getState()/subscribe/api.
 */
function useEventCalendarState<TData = unknown>(
  options: UseEventCalendarStateOptions<TData> = {},
): EventCalendarInstance<TData> {
  const [store] = useState(() => createEventCalendarStore<TData>(options));
  const changed = store.setOptions(options);
  const changedRef = useRef(false);
  if (changed) changedRef.current = true;
  useLayoutEffect(() => {
    if (changedRef.current) {
      changedRef.current = false;
      store.notify();
    }
  });
  useEffect(() => {
    store.emitRangeIfChanged();
    // mount-only: onRangeChange fires once for the initial range
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return store.instance;
}

const EventCalendarContext =
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  createContext<EventCalendarInstance<any> | null>(null);

/** The stable calendar instance; throws outside <EventCalendar>. */
function useEventCalendar<TData = unknown>(): EventCalendarInstance<TData> {
  const instance = useContext(EventCalendarContext);
  if (!instance) {
    throw new Error("useEventCalendar must be used within <EventCalendar>");
  }
  return instance as EventCalendarInstance<TData>;
}

interface UseEventCalendarSelectorOptions<TData, TSelected> {
  calendar?: EventCalendarInstance<TData>;
  isEqual?: (a: TSelected, b: TSelected) => boolean;
}

/** Fine-grained subscription with equality memoization (Object.is default). */
function useEventCalendarSelector<TData = unknown, TSelected = unknown>(
  selector: (state: EventCalendarState<TData>) => TSelected,
  options?: UseEventCalendarSelectorOptions<TData, TSelected>,
): TSelected {
  const contextInstance = useContext(EventCalendarContext);
  const instance = options?.calendar ?? contextInstance;
  if (!instance) {
    throw new Error(
      "useEventCalendarSelector needs an <EventCalendar> ancestor or an explicit `calendar` option",
    );
  }
  const isEqual = options?.isEqual ?? Object.is;
  const lastRef = useRef<{ value: TSelected } | null>(null);
  const selectorRef = useRef(selector);
  selectorRef.current = selector;

  const getSnapshot = () => {
    const next = selectorRef.current(
      instance.getState() as EventCalendarState<TData>,
    );
    if (lastRef.current && isEqual(lastRef.current.value, next)) {
      return lastRef.current.value;
    }
    lastRef.current = { value: next };
    return next;
  };

  return useSyncExternalStore(instance.subscribe, getSnapshot, getSnapshot);
}

function useEventCalendarView(): {
  view: CalendarView;
  dayCount: number;
  /** The resolved `views` option from settings. */
  availableViews: CalendarView[];
  setView: (view: CalendarView, opts?: { dayCount?: number }) => void;
} {
  const instance = useEventCalendar();
  const view = useEventCalendarSelector((state) => state.view);
  const dayCount = useEventCalendarSelector((state) => state.dayCount);
  useEventCalendarSettingsVersion(instance);
  return {
    view,
    dayCount,
    availableViews: instance.settings.views,
    setView: instance.api.setView,
  };
}

function useEventCalendarNavigation(): {
  date: Date;
  /** i18n.functions.formatTitle output for the current view. */
  title: string;
  visibleRange: EventCalendarDateRange;
  activeRange: EventCalendarDateRange;
  next: () => void;
  prev: () => void;
  today: () => void;
  goTo: (date: Date) => void;
  /** True when the anchor period contains now in the display time zone. */
  isToday: boolean;
} {
  const instance = useEventCalendar();
  const { settings } = instance;
  const slice = useEventCalendarSelector(
    (state) => ({
      date: state.date,
      view: state.view,
      visibleRange: state.visibleRange,
      activeRange: state.activeRange,
    }),
    {
      isEqual: (a, b) =>
        a.date.getTime() === b.date.getTime() &&
        a.view === b.view &&
        getRangeKey(a.visibleRange) === getRangeKey(b.visibleRange),
    },
  );
  useEventCalendarSettingsVersion(instance);
  const now = new Date();
  return {
    date: slice.date,
    title: settings.i18n.functions.formatTitle(slice.view, {
      date: toZoned(slice.date, settings.timeZone),
      activeRange: slice.activeRange,
      visibleRange: slice.visibleRange,
      locale: settings.locale,
    }),
    visibleRange: slice.visibleRange,
    activeRange: slice.activeRange,
    next: instance.api.next,
    prev: instance.api.prev,
    today: instance.api.today,
    goTo: instance.api.goTo,
    isToday: now >= slice.activeRange.start && now < slice.activeRange.end,
  };
}

function useEventCalendarSelection(): {
  selection: EventCalendarSelection;
  select: (selection: Partial<EventCalendarSelection>) => void;
  selectEvent: (key: string, opts?: { additive?: boolean }) => void;
  clearSelection: () => void;
} {
  const instance = useEventCalendar();
  const selection = useEventCalendarSelector((state) => state.selection);
  return {
    selection,
    select: instance.api.select,
    selectEvent: instance.api.selectEvent,
    clearSelection: instance.api.clearSelection,
  };
}

function useEventCalendarInteractions(): {
  interactions: EventCalendarInteractions;
  setInteractions: (patch: Partial<EventCalendarInteractions>) => void;
} {
  const instance = useEventCalendar();
  const interactions = useEventCalendarSelector((state) => state.interactions);
  return { interactions, setInteractions: instance.api.setInteractions };
}

/** Expanded, sorted occurrences; defaults to the visible range. */
function useEventCalendarOccurrences<TData = unknown>(
  range?: EventCalendarDateRange,
): EventCalendarOccurrence<TData>[] {
  const instance = useEventCalendar<TData>();
  return useEventCalendarSelector<TData, EventCalendarOccurrence<TData>[]>(
    () => instance.api.getOccurrences(range),
    {
      calendar: instance,
      // element identity, not keys: keys encode id+start only, so an end-only
      // resize or a title/color/data edit would never invalidate a key-based
      // memo. The index rebuilds occurrence objects precisely when events
      // change, so identity is the correct (and cheapest) change signal.
      isEqual: (a, b) =>
        a === b || (a.length === b.length && a.every((occ, i) => occ === b[i])),
    },
  );
}

const EMPTY_BUCKET: EventCalendarDayBucket = { allDay: [], timed: [] };

/** Per-cell subscription: only cells whose segments changed re-render. */
function useEventCalendarDay<TData = unknown>(
  day: Date,
): {
  segments: EventCalendarDayBucket<TData>;
  isToday: boolean;
  isOutside: boolean;
} {
  const instance = useEventCalendar<TData>();
  const { timeZone } = instance.settings;
  const dayKey = getDayKey(day, timeZone);

  const bucket = useEventCalendarSelector<TData, EventCalendarDayBucket<TData>>(
    () =>
      instance.internals.getIndex().byDay.get(dayKey) ??
      (EMPTY_BUCKET as EventCalendarDayBucket<TData>),
    {
      calendar: instance,
      // Element identity, not a content key: an occurrence key encodes
      // id+start only, so a title/color/data edit produced an identical key
      // and this cell kept serving its STALE segments. Buckets come straight
      // out of the memoized index, which rebuilds precisely when events
      // change, so identity is both correct and the cheapest signal.
      isEqual: (a, b) =>
        a === b ||
        (a.allDay.length === b.allDay.length &&
          a.timed.length === b.timed.length &&
          a.allDay.every((segment, i) => segment === b.allDay[i]) &&
          a.timed.every((segment, i) => segment === b.timed[i])),
    },
  );
  const activeRange = useEventCalendarSelector<TData, EventCalendarDateRange>(
    (state) => state.activeRange,
    {
      calendar: instance,
      isEqual: (a, b) => getRangeKey(a) === getRangeKey(b),
    },
  );
  const dayStart = zonedStartOfDay(day, timeZone);
  return {
    segments: bucket,
    isToday: getDayKey(new Date(), timeZone) === dayKey,
    isOutside: dayStart < activeRange.start || dayStart >= activeRange.end,
  };
}

const EMPTY_BARS: EventCalendarSegment[] = [];

/**
 * Per-week-row subscription for the month view: the laned multi-day/all-day
 * bar segments (one per occurrence per row, colStart/colSpan/lane set) that
 * render as continuous cross-day bars. `laneCount` is the row's bar height.
 * Matched by CONTAINMENT - any day inside the row resolves it - so a
 * weekends-hidden month (first visible day Monday) still finds its row;
 * `rowStart` returns the row's TRUE start for colStart/colSpan day math.
 */
function useEventCalendarWeek<TData = unknown>(
  day: Date,
): {
  bars: EventCalendarSegment<TData>[];
  laneCount: number;
  rowStart: Date | null;
} {
  const instance = useEventCalendar<TData>();
  const { timeZone } = instance.settings;
  const dayStartMs = zonedStartOfDay(day, timeZone).getTime();

  const row = useEventCalendarSelector<
    TData,
    { bars: EventCalendarSegment<TData>[]; rowStart: Date | null }
  >(
    () => {
      const index = instance.internals.getIndex();
      const match = index.weekRows.find((r) => {
        const startMs = zonedStartOfDay(r.rowStart, timeZone).getTime();
        // calendar-aware row end: a fixed 168h window would let the first
        // day AFTER a spring-forward week (167h long) match the wrong row
        const endMs = zonedStartOfDay(
          addDays(toZoned(r.rowStart, timeZone), 7),
          timeZone,
        ).getTime();
        return dayStartMs >= startMs && dayStartMs < endMs;
      });
      return {
        bars: match?.bars ?? (EMPTY_BARS as EventCalendarSegment<TData>[]),
        rowStart: match?.rowStart ?? null,
      };
    },
    {
      calendar: instance,
      // Same reasoning as the day bucket above: `bars` is the array held by
      // the memoized index, so element identity catches content edits that a
      // key built from id+start could never see.
      isEqual: (a, b) =>
        (a.rowStart?.getTime() ?? 0) === (b.rowStart?.getTime() ?? 0) &&
        (a.bars === b.bars ||
          (a.bars.length === b.bars.length &&
            a.bars.every((segment, i) => segment === b.bars[i]))),
    },
  );
  const laneCount = row.bars.reduce(
    (m, s) => Math.max(m, (s.lane ?? 0) + 1),
    0,
  );
  return { bars: row.bars, laneCount, rowStart: row.rowStart };
}

/**
 * User view settings (weekends, week numbers, now line, off days, schedule
 * hint) + the effective values after falling back to the root view-config
 * props. Drives the nav submenu; fully controllable from outside via
 * `viewSettings`/`onViewSettingsChange` or api.setViewSettings.
 */
function useEventCalendarViewSettings(): {
  viewSettings: EventCalendarViewSettings;
  setViewSettings: (patch: EventCalendarViewSettings) => void;
  effective: Required<EventCalendarViewSettings>;
} {
  const instance = useEventCalendar();
  const viewConfig = useEventCalendarViewConfig();
  const viewSettings = useEventCalendarSelector((state) => state.viewSettings);
  return {
    viewSettings,
    setViewSettings: instance.api.setViewSettings,
    effective: {
      weekends: viewSettings.weekends ?? true,
      weekNumbers: viewSettings.weekNumbers ?? viewConfig.showWeekNumbers,
      nowIndicator: viewSettings.nowIndicator ?? viewConfig.nowIndicator,
      offDays:
        viewSettings.offDays ??
        (viewConfig.offDays !== undefined && viewConfig.offDays !== false),
    },
  };
}

/** Subscribes to settings changes only (version counter, not state). */
function useEventCalendarSettingsVersion<TData>(
  instance: EventCalendarInstance<TData>,
): number {
  return useSyncExternalStore(
    instance.subscribe,
    instance.internals.getSettingsVersion,
    instance.internals.getSettingsVersion,
  );
}

/** Resolved settings incl. merged i18n; re-renders only when settings change. */
function useEventCalendarSettings<
  TData = unknown,
>(): EventCalendarSettings<TData> {
  const instance = useEventCalendar<TData>();
  useEventCalendarSettingsVersion(instance);
  return instance.settings;
}

const EventCalendarViewContext = createContext<{ view: CalendarView } | null>(
  null,
);

/**
 * Per-element class hooks, cn()-merged AFTER the built-in classes (so tailwind
 * variants and ! overrides win). Metric CSS variables can ride on any parent
 * key, e.g. classNames.timeGrid: "[--ec-gutter-width:4.5rem]".
 */
interface EventCalendarClassNames {
  nav?: string;
  toolbar?: string;
  content?: string;
  monthView?: string;
  monthCell?: string;
  timeGrid?: string;
  timeGutter?: string;
  dayColumn?: string;
  allDaySection?: string;
  agendaView?: string;
  event?: string;
  /** The styled hover tooltip popup (viewConfig.eventTooltip). */
  eventTooltip?: string;
  moreIndicator?: string;
  /** The "+N more" popover panel. Control the on-demand scroll cap through
   *  the CSS variable, e.g. "[--ec-more-max-height:20rem]". */
  morePopover?: string;
  /** "+N more" popover day header row. */
  morePopoverHeader?: string;
  // nav family (reachable without recomposing the default nav)
  navButton?: string;
  title?: string;
  navTooltip?: string;
  viewSwitcherContent?: string;
  viewSwitcherLabel?: string;
  viewShortcut?: string;
  datePickerContent?: string;
  // month view
  monthHeader?: string;
  monthDayHeader?: string;
  monthBody?: string;
  monthRow?: string;
  weekNumber?: string;
  monthBarOverlay?: string;
  monthBar?: string;
  monthCellContent?: string;
  monthCellFooter?: string;
  monthDayNumber?: string;
  dayAddButton?: string;
  // time grid / resource
  timeGridHeader?: string;
  timeGutterLabel?: string;
  allDayLabel?: string;
  allDayCell?: string;
  timedChip?: string;
  resourceHeader?: string;
  // interaction surfaces (shared by every view)
  dragGhost?: string;
  dragCarry?: string;
  dragCarryInvalid?: string;
  dropHint?: string;
  dropIndicator?: string;
  slotDraft?: string;
  resizeHandle?: string;
  resizeGrip?: string;
  // agenda
  noEvents?: string;
  agendaDayHeader?: string;
  agendaDay?: string;
  agendaDayGutter?: string;
  agendaDate?: string;
  agendaDayToggle?: string;
  agendaDayContent?: string;
  agendaItem?: string;
  agendaItemSurface?: string;
  agendaItemToggle?: string;
  agendaDaySummary?: string;
  agendaSummaryDot?: string;
}

interface EventCalendarRenderEventProps<TData = unknown> {
  occurrence: EventCalendarOccurrence<TData>;
  segment: EventCalendarSegment<TData>;
  view: CalendarView;
  isDragging: boolean;
  isSelected: boolean;
}

/**
 * View-layer configuration: display props and render overrides. These live on
 * <EventCalendar> (and per-view components), never in the headless options.
 */
interface EventCalendarViewConfig<TData = unknown> {
  scrollToHour: number;
  nowIndicator: boolean;
  /**
   * Grid interval in minutes for the time-based views (day, week, N-days,
   * time grid): gutter slots and gridlines follow it. Also accepted as a
   * prop on each view component.
   */
  interval: number;
  maxEventsPerCell: number | "auto";
  showWeekNumbers: boolean;
  enableShortcuts: boolean;
  shortcutsScope: "focus-within" | "global";
  /**
   * "contained" (default): the calendar fills its container and views scroll
   * internally. "page": content flows with the document, the page scrolls,
   * and day headers stick below `--ec-sticky-offset` (default 0px).
   */
  scrollMode: "contained" | "page";
  /** Stick the default nav to the top while the page scrolls. */
  stickyNav: boolean;
  /**
   * Custom per-day indication (light background classes work in both themes,
   * e.g. "bg-amber-500/10"). Applied to month cells, time-grid day columns,
   * and all-day cells; content stays readable on top of it.
   */
  dayClassName?: (day: Date) => string | undefined;
  /**
   * Extra classes for the CURRENT day, appended after the built-in highlight
   * (primary-tinted background + accent top border) on month cells, time-grid
   * day columns, and day headers.
   */
  todayClassName?: string;
  /**
   * Show a hover "+" add affordance on month cells next to the day number.
   * It fires the same onSlotClick as clicking the day. Calendar-level config
   * (consistent affordance, wired to the create flow); use renderMonthCell
   * when a fully custom cell is needed instead.
   */
  showDayAddButton: boolean;
  /**
   * Scroll implementation for every internally scrolling surface (time grid,
   * agenda, time-grid resources, month "+N more" popover):
   * "custom" (default, shadcn ScrollArea) or "native" (browser scrollbars
   * via overflow auto).
   */
  scrollbars: "custom" | "native";
  /** Nav button variant; all nav buttons follow it. Default "ghost". */
  navButtonVariant: NonNullable<ButtonProps["variant"]>;
  /** Nav button size; icon buttons use the icon twin. Default "sm". */
  navButtonSize: "sm" | "default";
  /**
   * Off-day (non-working day) marking. true = weekends with a muted
   * background; a config object customizes weekdays, explicit dates, a
   * predicate, and the marker class. Marked cells carry data-off.
   */
  offDays?: boolean | EventCalendarOffDaysConfig;
  classNames?: EventCalendarClassNames;
  components?: Partial<Record<CalendarView, ComponentType>>;
  renderEvent?: (props: EventCalendarRenderEventProps<TData>) => ReactNode;
  renderAgendaEvent?: (
    props: EventCalendarRenderEventProps<TData>,
  ) => ReactNode;
  /**
   * Content for the styled hover tooltip (viewConfig.eventTooltip). Return a
   * falsy value (null / undefined, or the `false` a `cond && <node>` yields)
   * to fall back to the default label (title + time); `label` itself is
   * undefined when a consumer i18n.formatEventLabel opts out.
   */
  renderEventTooltip?: (props: {
    occurrence: EventCalendarOccurrence<TData>;
    segment: EventCalendarSegment<TData>;
    view: CalendarView;
    label: string | undefined;
  }) => ReactNode;
  renderDragPreview?: (props: {
    drag: EventCalendarDragState<TData>;
  }) => ReactNode;
  renderMonthCell?: (props: {
    day: Date;
    segments: EventCalendarDayBucket<TData>;
    isToday: boolean;
    isOutside: boolean;
    overflowCount: number;
    defaultContent: ReactNode;
  }) => ReactNode;
  /**
   * Time-grid business-logic layer, rendered pointer-events-none BEHIND event
   * segments in each day column. Position overlays with
   * top/height: calc(var(--ec-hour-height) * minutes / 60).
   */
  renderDayColumnBackground?: (props: {
    day: Date;
    boundsStartMin: number;
    boundsEndMin: number;
    totalMinutes: number;
  }) => ReactNode;
  renderDayHeader?: (props: {
    day: Date;
    view: CalendarView;
    isToday: boolean;
  }) => ReactNode;
  renderTimeGutterSlot?: (props: {
    time: Date;
    hour: number;
    minute: number;
  }) => ReactNode;
  renderAllDaySection?: (props: {
    days: Date[];
    segments: EventCalendarSegment<TData>[];
  }) => ReactNode;
  renderMoreIndicator?: (props: {
    day: Date;
    count: number;
    segments: EventCalendarSegment<TData>[];
  }) => ReactNode;
  /**
   * Replaces the ENTIRE body of the built-in "+N more" popover (header +
   * chip list) while keeping its trigger and positioning; `close` dismisses
   * it. For a fully custom surface, return false from onMoreClick instead
   * and open your own UI.
   */
  renderMoreContent?: (props: {
    day: Date;
    segments: EventCalendarSegment<TData>[];
    close: () => void;
  }) => ReactNode;
  /**
   * Agenda-only expandable details. When it returns a node for an occurrence,
   * the agenda row gains an expand/collapse toggle revealing the details
   * below the chip (the calendar itself never knows the consumer's fields).
   */
  renderAgendaEventDetails?: (
    occurrence: EventCalendarOccurrence<TData>,
  ) => ReactNode;
  renderNowIndicator?: (props: { time: Date }) => ReactNode;
  renderNoEvents?: () => ReactNode;
  /** Resource column header cell content; default is resource.title. */
  renderResourceHeader?: (props: {
    resource: EventCalendarResource;
  }) => ReactNode;
  /** Agenda date gutter (day badge + weekday + collapse toggle). */
  renderAgendaDayHeader?: (props: {
    day: Date;
    collapsed: boolean;
    count: number;
    toggle: () => void;
    defaultContent: ReactNode;
  }) => ReactNode;
  /** Collapsed agenda day summary row content. */
  renderAgendaDaySummary?: (props: {
    day: Date;
    occurrences: EventCalendarOccurrence<TData>[];
    count: number;
    expand: () => void;
    defaultContent: ReactNode;
  }) => ReactNode;
  /**
   * N-day presets offered by the view switcher when the "days" view is
   * enabled. @default [5]
   */
  dayCountPresets: number[];
  /**
   * Nav tooltips: false disables them all; an object tunes placement and
   * timings. @default { side: "bottom", delay: 600, closeDelay: 0, timeout: 300 }
   */
  navTooltips?:
    | false
    | {
        side?: "top" | "bottom" | "left" | "right";
        delay?: number;
        closeDelay?: number;
        timeout?: number;
      };
  /**
   * Styled tooltip on event hover / keyboard focus. `false` (default) keeps
   * only the native title attribute; `true` shows the standard Tooltip with
   * the event label; an object also tunes the side and open delay. Content is
   * overridable with renderEventTooltip. @default false
   */
  eventTooltip?:
    | boolean
    | {
        side?: "top" | "bottom" | "left" | "right";
        delay?: number;
      };
  /**
   * Timed events shorter than this render the compact single-row chip layout.
   * @default 45
   */
  compactEventMinutes: number;
  /** "+N more" popover alignment against its trigger. @default "start" */
  morePopoverAlign: "start" | "center" | "end";
  /** Now-indicator refresh cadence in milliseconds. @default 30000 */
  nowIndicatorInterval: number;
  /** Max color dots in a collapsed agenda day summary. @default 6 */
  agendaSummaryMaxDots: number;
}

const DEFAULT_VIEW_CONFIG: EventCalendarViewConfig = {
  scrollToHour: 7,
  nowIndicator: true,
  interval: 60,
  maxEventsPerCell: "auto",
  showWeekNumbers: false,
  enableShortcuts: true,
  shortcutsScope: "focus-within",
  scrollMode: "contained",
  stickyNav: false,
  showDayAddButton: false,
  scrollbars: "custom",
  navButtonVariant: "ghost",
  navButtonSize: "sm",
  dayCountPresets: [5],
  eventTooltip: false,
  compactEventMinutes: 45,
  morePopoverAlign: "start",
  nowIndicatorInterval: 30_000,
  agendaSummaryMaxDots: 6,
};

const EventCalendarViewConfigContext =
  createContext<
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    EventCalendarViewConfig<any>
  >(DEFAULT_VIEW_CONFIG);

/** Root-level display props + render overrides, for view components. */
function useEventCalendarViewConfig<
  TData = unknown,
>(): EventCalendarViewConfig<TData> {
  return useContext(EventCalendarViewConfigContext);
}

const VIEW_CONFIG_KEYS: Array<keyof EventCalendarViewConfig> = [
  "scrollToHour",
  "nowIndicator",
  "interval",
  "maxEventsPerCell",
  "showWeekNumbers",
  "enableShortcuts",
  "shortcutsScope",
  "scrollMode",
  "stickyNav",
  "dayClassName",
  "todayClassName",
  "showDayAddButton",
  "scrollbars",
  "navButtonVariant",
  "navButtonSize",
  "offDays",
  "classNames",
  "components",
  "renderEvent",
  "renderAgendaEvent",
  "renderEventTooltip",
  "renderDragPreview",
  "renderMonthCell",
  "renderDayColumnBackground",
  "renderDayHeader",
  "renderTimeGutterSlot",
  "renderAllDaySection",
  "renderMoreIndicator",
  "renderMoreContent",
  "renderNowIndicator",
  "renderNoEvents",
  "renderAgendaEventDetails",
  "renderResourceHeader",
  "renderAgendaDayHeader",
  "renderAgendaDaySummary",
  "dayCountPresets",
  "navTooltips",
  "eventTooltip",
  "compactEventMinutes",
  "morePopoverAlign",
  "nowIndicatorInterval",
  "agendaSummaryMaxDots",
];

/** The rendering view of the nearest view component ("month", "week", ...). */
function useEventCalendarViewContext(): { view: CalendarView } {
  const ctx = useContext(EventCalendarViewContext);
  if (!ctx) {
    throw new Error(
      "useEventCalendarViewContext must be used inside a calendar view",
    );
  }
  return ctx;
}

interface EventCalendarProps<TData = unknown>
  extends UseEventCalendarStateOptions<TData>,
    Partial<EventCalendarViewConfig<TData>>,
    Omit<useRender.ComponentProps<"div">, "children" | "defaultValue"> {
  /** Adopt a hoisted useEventCalendarState instance; option props are then ignored. */
  calendar?: EventCalendarInstance<TData>;
  /** Imperative escape hatch usable from outside the tree. */
  apiRef?: RefObject<EventCalendarApi<TData> | null>;
  children?: ReactNode;
}

const OPTION_KEYS: Array<keyof UseEventCalendarStateOptions> = [
  "events",
  "defaultEvents",
  "view",
  "defaultView",
  "date",
  "defaultDate",
  "dayCount",
  "defaultDayCount",
  "selection",
  "defaultSelection",
  "interactions",
  "defaultInteractions",
  "viewSettings",
  "defaultViewSettings",
  "loading",
  "views",
  "timeZone",
  "locale",
  "weekStartsOn",
  "dayStartHour",
  "dayEndHour",
  "slotDuration",
  "snapDuration",
  "agendaDayCount",
  "fixedWeeks",
  "showOutsideDays",
  "i18n",
  "resources",
  "getEventPriority",
  "eventOrder",
  "getOccurrences",
  "weekendDays",
  "activation",
  "onEventClick",
  "onEventDoubleClick",
  "onEventUpdate",
  "canDropEvent",
  "onDragBlocked",
  "onSlotClick",
  "onSelectSlot",
  "canSelectSlot",
  "onRangeChange",
  "onViewChange",
  "onDateChange",
  "onDayCountChange",
  "onSelectionChange",
  "onInteractionsChange",
  "onViewSettingsChange",
  "onEventsChange",
  "onMoreClick",
];

function splitOptions<TData>(props: Record<string, unknown>): {
  options: UseEventCalendarStateOptions<TData>;
  viewConfig: EventCalendarViewConfig<TData>;
  rest: Record<string, unknown>;
} {
  const options: Record<string, unknown> = {};
  const viewConfig: Record<string, unknown> = { ...DEFAULT_VIEW_CONFIG };
  const rest: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(props)) {
    if ((OPTION_KEYS as string[]).includes(key)) options[key] = value;
    else if ((VIEW_CONFIG_KEYS as string[]).includes(key)) {
      if (value !== undefined) viewConfig[key] = value;
    } else rest[key] = value;
  }
  return {
    options: options as UseEventCalendarStateOptions<TData>,
    viewConfig: viewConfig as unknown as EventCalendarViewConfig<TData>,
    rest,
  };
}

/**
 * Root provider + container. Composition contract:
 * <EventCalendar><EventCalendarNav/><EventCalendarToolbar/><EventCalendarContent/></EventCalendar>
 */
function EventCalendar<TData = unknown>({
  calendar,
  apiRef,
  className,
  render,
  children,
  ...props
}: EventCalendarProps<TData>) {
  const { options, viewConfig, rest } = splitOptions<TData>(
    props as Record<string, unknown>,
  );

  if (calendar && Object.keys(options).length > 0) {
    warnOnce(
      "calendar-and-options",
      "both `calendar` and option props were passed; option props are ignored when adopting an instance.",
    );
  }

  const own = useEventCalendarState<TData>(calendar ? {} : options);
  const instance = calendar ?? own;

  useEffect(() => {
    if (apiRef) apiRef.current = instance.api;
  }, [apiRef, instance]);

  // Register the root element so the drag engine can find day cells even when a
  // gesture starts from a portaled surface (the "+N more" popover).
  const registerRoot = useCallback(
    (el: HTMLElement | null) => instance.internals.setRootEl(el),
    [instance],
  );

  const defaultProps = {
    "data-slot": "event-calendar",
    ref: registerRoot,
    // text-xs is the calendar-wide default type size; because it sits before
    // `className`, a consumer can override the whole scale with e.g.
    // <EventCalendar className="text-sm"> and every inheriting element follows.
    // Inner elements omit their own text-size so they cascade from here (the
    // few portaled surfaces - "+N more" popover, drag carry clone - pin the
    // size explicitly since DOM inheritance does not cross a portal).
    className: cn("flex min-h-0 min-w-0 flex-col text-xs", className),
    children: (
      <>
        {children}
        <div
          data-slot="event-calendar-announcer"
          aria-live="polite"
          className="sr-only"
        />
      </>
    ),
  };

  return (
    <EventCalendarContext.Provider value={instance}>
      <EventCalendarViewConfigContext.Provider value={viewConfig}>
        {useRender({
          defaultTagName: "div",
          render,
          props: mergeProps<"div">(defaultProps, rest),
        })}
      </EventCalendarViewConfigContext.Provider>
    </EventCalendarContext.Provider>
  );
}

export { EventCalendarContent } from "./event-calendar-content";
export {
  EventCalendarDayView,
  EventCalendarWeekView,
} from "./event-calendar-time-grid";
export {
  ALL_VIEWS,
  BASE_VIEWS,
  DEFAULT_VIEW_CONFIG,
  EventCalendar,
  EventCalendarContext,
  EventCalendarViewConfigContext,
  EventCalendarViewContext,
  useEventCalendar,
  useEventCalendarDay,
  useEventCalendarWeek,
  useEventCalendarInteractions,
  useEventCalendarNavigation,
  useEventCalendarOccurrences,
  useEventCalendarSelection,
  useEventCalendarSelector,
  useEventCalendarSettings,
  useEventCalendarSettingsVersion,
  useEventCalendarState,
  useEventCalendarView,
  useEventCalendarViewConfig,
  useEventCalendarViewContext,
  useEventCalendarViewSettings,
};
export type {
  CalendarEvent,
  CalendarView,
  EventCalendarOccurrence,
  EventCalendarProposedUpdate,
  EventCalendarSlotDraft,
  EventCalendarSlotInfo,
  EventCalendarUpdateResult,
} from "./event-calendar-types";
export type {
  EventCalendarActivationConfig,
  EventCalendarApi,
  EventCalendarCallbacks,
  EventCalendarClassNames,
  EventCalendarInstance,
  EventCalendarInternals,
  EventCalendarProps,
  EventCalendarRenderEventProps,
  EventCalendarSettings,
  EventCalendarViewConfig,
  UseEventCalendarStateOptions,
};
