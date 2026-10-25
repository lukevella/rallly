// Title: Event Calendar Dnd
// Description: Custom pointer-event interaction engine - move, resize, and drag-create across month, week, day, and N-day views with live validation.

"use client";

import { addDays, addMinutes, differenceInCalendarDays } from "date-fns";
import { useCallback, useMemo } from "react";
import type { EventCalendarInstance } from "./event-calendar";
import { useEventCalendar, useEventCalendarViewConfig } from "./event-calendar";
import { snapMinutes, toZoned, zonedStartOfDay } from "./event-calendar-lib";
import type {
  EventCalendarProposedUpdate,
  EventCalendarSegment,
} from "./event-calendar-types";

/**
 * Activation policy (dnd-kit parity where proven):
 * mouse move 5px before a drag starts (below = click), create 4px;
 * touch long-press 250ms with 5px tolerance (movement past tolerance
 * before the delay cancels the drag so taps stay taps).
 */
const EVENT_CALENDAR_ACTIVATION = {
  moveDistancePx: 5,
  createDistancePx: 4,
  touchDelayMs: 250,
  touchTolerancePx: 5,
  autoScrollEdgePx: 48,
  autoScrollMaxStepPx: 15,
} as const;

type GestureKind = "move" | "resize-start" | "resize-end" | "create";

interface TimeColumnRect {
  day: Date;
  rect: DOMRect;
  boundsStartMin: number;
  boundsEndMin: number;
  resourceId?: string;
}

interface DayCellRect {
  day: Date;
  rect: DOMRect;
}

interface Surface {
  /** Minute-precise day columns (week/day/days) or resource columns. */
  columns: TimeColumnRect[];
  /** Day-precise cells (month grid, all-day row). */
  cells: DayCellRect[];
  viewport: HTMLElement | null;
  /**
   * Viewport rect captured ONCE at gesture start. The scroll container does
   * not move on screen while a pointer drag is captured (auto-scroll changes
   * its scrollTop, not its box), so reusing this avoids a per-pointermove
   * getBoundingClientRect - that read forces a synchronous full-document
   * reflow, which is cheap on a bare demo page but ~200ms on a long docs page
   * (big prop tables re-lay-out on every flush), turning drag into a slideshow.
   */
  viewportRect: DOMRect | null;
  viewportStartScrollTop: number;
  /**
   * Live scrollTop, seeded from the start value and advanced by auto-scroll
   * itself. Tracking it here lets pointerMinutes read a number instead of the
   * DOM `scrollTop` property every move (another forced reflow).
   */
  scrollTop: number;
}

/** Module flag so chip onClick can ignore the click that ends a drag. */
let lastGestureEndedAt = 0;
function wasRecentDrag(): boolean {
  return performance.now() - lastGestureEndedAt < 250;
}

/**
 * A press that started on an event chip. Slot-create clicks consult this so a
 * refused drag (e.g. a locked chip that never registers a gesture) whose
 * trailing native click retargets to the empty grid does NOT open a create
 * dialog. Refreshed on release so it covers long presses; the chip's own
 * click-to-edit is unaffected (only grid slot-clicks check it).
 */
let lastChipPressAt = 0;
function markChipPress(): void {
  lastChipPressAt = performance.now();
  window.addEventListener(
    "pointerup",
    () => {
      lastChipPressAt = performance.now();
    },
    { once: true, capture: true },
  );
}
function wasRecentChipPress(): boolean {
  return performance.now() - lastChipPressAt < 300;
}

/**
 * Snap a translate offset to the device pixel grid. The cursor-following
 * overlays (carry clone, drop hint) are their own `will-change: transform`
 * compositing layers: the GPU rasterizes their text once and repositions that
 * texture each frame, so a subpixel translate (getBoundingClientRect and raw
 * clientX/Y are routinely fractional) resamples the texture and blurs the
 * text. Rounding each offset to a whole device pixel lands the layer on the
 * grid so glyphs stay crisp, without giving up the per-frame GPU transform.
 */
function snapToPixel(value: number): number {
  const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
  return Math.round(value * dpr) / dpr;
}

function collectSurface(
  origin: HTMLElement,
  fallbackRoot?: HTMLElement | null,
): Surface {
  // A gesture from a portaled surface (the "+N more" popover) has no calendar
  // ancestor, so fall back to the root the host registered on the instance.
  const root =
    origin.closest<HTMLElement>("[data-slot=event-calendar-time-grid]") ??
    origin.closest<HTMLElement>("[data-slot=event-calendar-resource-view]") ??
    origin.closest<HTMLElement>("[data-slot=event-calendar-month-view]") ??
    origin.closest<HTMLElement>("[data-slot=event-calendar]") ??
    fallbackRoot ??
    null;

  const columns: TimeColumnRect[] = [];
  const cells: DayCellRect[] = [];
  if (root) {
    for (const el of root.querySelectorAll<HTMLElement>("[data-ec-day]")) {
      const day = new Date(Number(el.dataset.ecDay));
      if (el.dataset.ecBoundsStart !== undefined) {
        columns.push({
          day,
          rect: el.getBoundingClientRect(),
          boundsStartMin: Number(el.dataset.ecBoundsStart),
          boundsEndMin: Number(el.dataset.ecBoundsEnd),
          resourceId: el.dataset.ecResource,
        });
      } else {
        cells.push({ day, rect: el.getBoundingClientRect() });
      }
    }
  }
  const viewport =
    root?.querySelector<HTMLElement>("[data-slot=scroll-area-viewport]") ??
    null;
  const viewportStartScrollTop = viewport?.scrollTop ?? 0;
  return {
    columns,
    cells,
    viewport,
    viewportRect: viewport?.getBoundingClientRect() ?? null,
    viewportStartScrollTop,
    scrollTop: viewportStartScrollTop,
  };
}

function findColumn(
  surface: Surface,
  clientX: number,
): TimeColumnRect | undefined {
  const scrollAdjusted = surface.columns;
  let best: TimeColumnRect | undefined;
  for (const col of scrollAdjusted) {
    if (clientX >= col.rect.left && clientX < col.rect.right) return col;
    if (!best) best = col;
    // clamp to nearest horizontal column
    const bestDist = Math.min(
      Math.abs(clientX - best.rect.left),
      Math.abs(clientX - best.rect.right),
    );
    const dist = Math.min(
      Math.abs(clientX - col.rect.left),
      Math.abs(clientX - col.rect.right),
    );
    if (dist < bestDist) best = col;
  }
  return best;
}

function findCell(
  surface: Surface,
  x: number,
  y: number,
): DayCellRect | undefined {
  return surface.cells.find(
    (cell) =>
      x >= cell.rect.left &&
      x < cell.rect.right &&
      y >= cell.rect.top &&
      y < cell.rect.bottom,
  );
}

function pointerMinutes(
  surface: Surface,
  col: TimeColumnRect,
  clientY: number,
): number {
  const scrollDelta = surface.scrollTop - surface.viewportStartScrollTop;
  const boundsMinutes = col.boundsEndMin - col.boundsStartMin;
  const pxPerMinute = col.rect.height / Math.max(1, boundsMinutes);
  const y = clientY - col.rect.top + scrollDelta;
  return col.boundsStartMin + y / pxPerMinute;
}

interface BeginGestureConfig<TData> {
  instance: EventCalendarInstance<TData>;
  kind: GestureKind;
  origin: HTMLElement;
  startEvent: PointerEvent;
  segment?: EventCalendarSegment<TData>;
  /** create only */
  createDay?: Date;
  createAllDay?: boolean;
  /**
   * Consumer classNames for the engine's vanilla-DOM overlays (carry clone,
   * validation hint pill), forwarded by the gestures hook - the engine itself
   * must never import from the React chip module.
   */
  ui?: {
    dragCarry?: string;
    dragCarryInvalid?: string;
    dropHint?: string;
  };
}

/**
 * A move/resize was refused (locked, per-event disabled, or interaction off).
 * Rather than silently swallow the press, track the pointer: once it crosses
 * the activation threshold - i.e. the user genuinely tried to drag - show a
 * not-allowed cursor and broadcast once via onDragBlocked so the consumer can
 * explain it. The calendar picks no message. Fires at most once per gesture.
 */
function beginBlockedGesture<TData>(
  instance: EventCalendarInstance<TData>,
  startEvent: PointerEvent,
  segment: EventCalendarSegment<TData>,
  gesture: "move" | "resize",
) {
  const startX = startEvent.clientX;
  const startY = startEvent.clientY;
  const activation = {
    ...EVENT_CALENDAR_ACTIVATION,
    ...instance.settings.activation,
  };
  const event = segment.occurrence.event;
  const reason: "readOnly" | "disabled" | "interactions-off" = event.readOnly
    ? "readOnly"
    : (gesture === "move" ? event.draggable : event.resizable) === false
      ? "disabled"
      : "interactions-off";
  let activated = false;
  const onMove = (e: PointerEvent) => {
    if (activated) return;
    if (
      Math.hypot(e.clientX - startX, e.clientY - startY) <
      activation.moveDistancePx
    ) {
      return;
    }
    activated = true;
    document.body.style.cursor = "not-allowed";
    // body class alongside the inline cursor so consumer CSS can restyle or
    // detect the blocked-drag state (mirrors "ec-dragging")
    document.body.classList.add("ec-drag-blocked");
    instance.settings.onDragBlocked?.(segment.occurrence, { gesture, reason });
  };
  const cleanup = () => {
    window.removeEventListener("pointermove", onMove);
    window.removeEventListener("pointerup", cleanup);
    window.removeEventListener("pointercancel", cleanup);
    if (activated) {
      document.body.style.cursor = "";
      document.body.classList.remove("ec-drag-blocked");
      // the pointer travelled: suppress the trailing click so the event's own
      // dialog does not open on top of the rejection message
      lastGestureEndedAt = performance.now();
    }
  };
  window.addEventListener("pointermove", onMove);
  window.addEventListener("pointerup", cleanup);
  window.addEventListener("pointercancel", cleanup);
}

function beginGesture<TData>(config: BeginGestureConfig<TData>) {
  const { instance, kind, origin, startEvent, segment, ui } = config;
  const { settings, internals, api } = instance;
  const timeZone = settings.timeZone;
  const snap = settings.snapDuration;
  // per-calendar tuning shallow-merged over the module defaults
  const activation = { ...EVENT_CALENDAR_ACTIVATION, ...settings.activation };
  const startX = startEvent.clientX;
  const startY = startEvent.clientY;

  let active = kind.startsWith("resize"); // resize activates immediately
  let surface: Surface | null = active
    ? collectSurface(origin, internals.getRootEl())
    : null;
  let rafScroll: number | null = null;
  let lastProposalKey = "";
  let touchTimer: ReturnType<typeof setTimeout> | null = null;
  let hintEl: HTMLDivElement | null = null;
  let lastValid = true;
  // Drag-create anchor minute, frozen at the first proposal: re-deriving it
  // from the stale startY client coordinate + the CURRENT scroll delta would
  // make the anchor drift with auto-scroll instead of staying pinned.
  let createAnchorMin: number | null = null;
  let lastPointer: PointerEvent = startEvent;
  const isTouch = startEvent.pointerType === "touch";

  const occurrence = segment?.occurrence;
  const isBar = occurrence
    ? occurrence.allDay ||
      occurrence.end.getTime() - occurrence.start.getTime() >
        24 * 60 * 60 * 1000
    : false;

  // Preserve the grab offset so the event does not jump to the pointer
  let grabOffsetMin = 0;

  const activationDistance =
    kind === "create" ? activation.createDistancePx : activation.moveDistancePx;

  // Each gesture keeps its own cursor: a resize must stay ns/ew-resize for
  // the whole drag (flipping to grabbing reads as a move) - vertical for
  // timed blocks, horizontal for day-granular bars. Moves grab.
  const gestureCursor = kind.startsWith("resize")
    ? isBar
      ? "ew-resize"
      : "ns-resize"
    : "grabbing";
  const setBodyDragging = (on: boolean, invalid = false) => {
    document.body.classList.toggle("ec-dragging", on);
    document.body.style.cursor = on
      ? invalid
        ? "not-allowed"
        : gestureCursor
      : "";
    document.body.style.userSelect = on ? "none" : "";
    if (!on) document.body.style.removeProperty("-webkit-user-select");
  };

  const activate = () => {
    if (active) return;
    active = true;
    surface = collectSurface(origin, internals.getRootEl());
    if (kind === "move" && occurrence && surface.columns.length > 0 && !isBar) {
      const col = findColumn(surface, startX);
      if (col) {
        const startMin =
          (occurrence.start.getTime() -
            zonedStartOfDay(occurrence.start, timeZone).getTime()) /
          60000;
        grabOffsetMin = pointerMinutes(surface, col, startY) - startMin;
      }
    }
    setBodyDragging(true);
    createCarry();
  };

  const computeProposal = (
    e: PointerEvent,
  ): {
    start: Date;
    end: Date;
    allDay: boolean;
    dayGranular?: boolean;
    resourceId?: string;
  } | null => {
    if (!surface) return null;

    // ---- create: select a slot range
    if (kind === "create") {
      if (config.createAllDay || surface.columns.length === 0) {
        const anchor = zonedStartOfDay(config.createDay!, timeZone);
        const cell = findCell(surface, e.clientX, e.clientY);
        const target = cell ? zonedStartOfDay(cell.day, timeZone) : anchor;
        const start = anchor <= target ? anchor : target;
        const end = addDays(anchor <= target ? target : anchor, 1);
        return { start, end, allDay: true, dayGranular: true };
      }
      const col = findColumn(surface, startX);
      if (!col) return null;
      if (createAnchorMin === null) {
        createAnchorMin = snapMinutes(
          pointerMinutes(surface, col, startY),
          snap,
        );
      }
      const anchorMin = createAnchorMin;
      const curMin = snapMinutes(pointerMinutes(surface, col, e.clientY), snap);
      const lo = Math.max(col.boundsStartMin, Math.min(anchorMin, curMin));
      const hi = Math.min(
        col.boundsEndMin,
        Math.max(anchorMin, curMin, lo + snap),
      );
      const dayStart = zonedStartOfDay(col.day, timeZone);
      return {
        start: addMinutes(dayStart, lo),
        end: addMinutes(dayStart, hi),
        allDay: false,
        resourceId: col.resourceId,
      };
    }

    if (!occurrence) return null;
    const durationMs = occurrence.end.getTime() - occurrence.start.getTime();

    // ---- day-granularity: month cells and bars in the all-day row
    const overCell = findCell(surface, e.clientX, e.clientY);

    // A timed event dropped on the all-day lane (a day cell inside a surface
    // that also has time columns) converts to a full-day event on that day.
    if (
      kind === "move" &&
      !isBar &&
      surface.columns.length > 0 &&
      overCell !== undefined
    ) {
      const targetDay = zonedStartOfDay(overCell.day, timeZone);
      return {
        start: targetDay,
        end: addDays(targetDay, 1),
        allDay: true,
        dayGranular: true,
      };
    }

    const useCells =
      surface.columns.length === 0 || (isBar && overCell !== undefined);

    if (useCells) {
      const cell = overCell ?? findCell(surface, startX, startY);
      if (!cell) return null;
      const targetDay = zonedStartOfDay(cell.day, timeZone);
      if (kind === "move") {
        const originDay = zonedStartOfDay(occurrence.start, timeZone);
        const delta = differenceInCalendarDays(targetDay, originDay);
        const start = addDays(toZoned(occurrence.start, timeZone), delta);
        return {
          start,
          end: new Date(start.getTime() + durationMs),
          allDay: occurrence.allDay,
          dayGranular: true,
        };
      }
      // bar edge resize: day granularity
      if (kind === "resize-start") {
        const time =
          occurrence.start.getTime() -
          zonedStartOfDay(occurrence.start, timeZone).getTime();
        const start = new Date(targetDay.getTime() + time);
        if (start >= occurrence.end) return null;
        return {
          start,
          end: occurrence.end,
          allDay: occurrence.allDay,
          dayGranular: true,
        };
      }
      const time = occurrence.allDay
        ? 0
        : occurrence.end.getTime() -
          zonedStartOfDay(occurrence.end, timeZone).getTime();
      const end = occurrence.allDay
        ? addDays(targetDay, 1)
        : new Date(addDays(targetDay, time > 0 ? 0 : 1).getTime() + time);
      if (end <= occurrence.start) return null;
      return {
        start: occurrence.start,
        end,
        allDay: occurrence.allDay,
        dayGranular: true,
      };
    }

    // ---- minute-granularity: time-grid columns
    const col = findColumn(surface, e.clientX);
    if (!col) return null;
    const dayStart = zonedStartOfDay(col.day, timeZone);
    const rawMin = pointerMinutes(surface, col, e.clientY);

    if (kind === "move") {
      const newStartMin = snapMinutes(rawMin - grabOffsetMin, snap);
      const durationMin = Math.round(durationMs / 60000);
      const clamped = Math.min(
        Math.max(newStartMin, col.boundsStartMin),
        col.boundsEndMin - durationMin,
      );
      const start = addMinutes(dayStart, clamped);
      return {
        start,
        end: new Date(start.getTime() + durationMs),
        allDay: false,
        resourceId: col.resourceId,
      };
    }

    const min = snapMinutes(rawMin, snap);
    // Both endpoints expressed in the POINTED column's day coordinates.
    // Anchoring each endpoint to its OWN day breaks cross-midnight events:
    // a 23:30 pointer in the start day's column would apply 1410 minutes to
    // the end's next-day anchor and jump the end a full day late (and a
    // midnight-ending event computes occEndMin 0 against its own day).
    const occStartMinInCol = Math.round(
      (occurrence.start.getTime() - dayStart.getTime()) / 60000,
    );
    const occEndMinInCol = Math.round(
      (occurrence.end.getTime() - dayStart.getTime()) / 60000,
    );
    if (kind === "resize-start") {
      const clamped = Math.min(
        Math.max(min, col.boundsStartMin),
        Math.min(occEndMinInCol - snap, col.boundsEndMin),
      );
      const start = addMinutes(dayStart, clamped);
      if (start >= occurrence.end) return null;
      return { start, end: occurrence.end, allDay: false };
    }
    const clamped = Math.max(
      Math.min(min, col.boundsEndMin),
      Math.max(occStartMinInCol + snap, col.boundsStartMin),
    );
    const end = addMinutes(dayStart, clamped);
    if (end <= occurrence.start) return null;
    return { start: occurrence.start, end, allDay: false };
  };

  const applyProposal = (e: PointerEvent) => {
    const proposal = computeProposal(e);
    if (!proposal) return;
    const key = `${proposal.start.getTime()}-${proposal.end.getTime()}-${proposal.allDay}-${proposal.resourceId ?? ""}`;
    if (key === lastProposalKey) return;
    lastProposalKey = key;

    if (kind === "create") {
      const draft = { ...proposal, view: instance.getState().view };
      if (settings.canSelectSlot && !settings.canSelectSlot(draft)) return;
      internals.setSlotDraft(draft);
      return;
    }
    const update: EventCalendarProposedUpdate<TData> = {
      event: occurrence!.event,
      occurrence: occurrence!,
      ...proposal,
      source: kind as "drag" | "resize-start" | "resize-end",
    };
    if (kind === "move") update.source = "drag";
    const valid = settings.canDropEvent ? settings.canDropEvent(update) : true;
    lastValid = valid;
    setBodyDragging(true, !valid);
    internals.setDrag({
      kind: kind === "move" ? "move" : (kind as "resize-start" | "resize-end"),
      occurrence: occurrence!,
      proposedStart: proposal.start,
      proposedEnd: proposal.end,
      proposedAllDay: proposal.allDay,
      proposedDayGranular: proposal.dayGranular ?? false,
      proposedResourceId: proposal.resourceId,
      valid,
    });
  };

  // Cursor-attached carry clone for MOVE gestures: the event travels freely
  // with the pointer, like an absolutely positioned overlay, while the
  // in-grid ghost renders only a faint dashed placeholder at the snapped
  // drop slot (EVENT_CALENDAR_GHOST.move). Vanilla DOM: cloned once at
  // activation, transformed per pointermove, zero React work per frame.
  let carryEl: HTMLDivElement | null = null;
  let carryDX = 0;
  let carryDY = 0;
  const CARRY_CLASS =
    "bg-background pointer-events-none fixed top-0 left-0 z-100 overflow-hidden rounded-sm opacity-90 shadow-md will-change-transform" +
    (ui?.dragCarry ? ` ${ui.dragCarry}` : "");
  const CARRY_INVALID_CLASS =
    `${CARRY_CLASS} ring-destructive/60 ring-1` +
    (ui?.dragCarryInvalid ? ` ${ui.dragCarryInvalid}` : "");

  const createCarry = () => {
    if (kind !== "move") return;
    const chip =
      origin.closest<HTMLElement>("[data-slot=event-calendar-event]") ?? origin;
    const rect = chip.getBoundingClientRect();
    // The clone is re-parented to <body>, escaping the calendar's inherited
    // font-size, so copy the source chip's resolved type - this keeps the carry
    // matching the grid at any consumer text scale (e.g. root text-sm).
    const chipFont = getComputedStyle(chip);
    carryDX = startX - rect.left;
    carryDY = startY - rect.top;
    carryEl = document.createElement("div");
    carryEl.setAttribute("data-slot", "event-calendar-drag-carry");
    carryEl.setAttribute("aria-hidden", "true");
    carryEl.className = CARRY_CLASS;
    carryEl.style.width = `${rect.width}px`;
    carryEl.style.height = `${rect.height}px`;
    carryEl.style.fontSize = chipFont.fontSize;
    carryEl.style.lineHeight = chipFont.lineHeight;
    carryEl.style.transform = `translate3d(${snapToPixel(rect.left)}px, ${snapToPixel(rect.top)}px, 0)`;
    const clone = chip.cloneNode(true) as HTMLElement;
    clone.removeAttribute("data-dragging");
    clone.style.width = "100%";
    clone.style.height = "100%";
    carryEl.appendChild(clone);
    document.body.appendChild(carryEl);
  };

  const positionCarry = (e: PointerEvent) => {
    if (!carryEl) return;
    carryEl.style.transform = `translate3d(${snapToPixel(e.clientX - carryDX)}px, ${snapToPixel(e.clientY - carryDY)}px, 0)`;
    const cls = lastValid ? CARRY_CLASS : CARRY_INVALID_CLASS;
    if (carryEl.className !== cls) carryEl.className = cls;
  };

  // Cursor-following validation hint, visible ONLY while the proposal is
  // rejected (canDropEvent / bounds). Vanilla DOM: zero React work per frame;
  // pairs with the not-allowed cursor and the ghost's destructive marking.
  const updateHint = (e: PointerEvent) => {
    if (lastValid || !active) {
      hintEl?.remove();
      hintEl = null;
      return;
    }
    if (!hintEl) {
      hintEl = document.createElement("div");
      hintEl.setAttribute("data-slot", "event-calendar-drop-hint");
      // physical left-0 anchor: translate3d positions in physical clientX
      // coordinates, so a logical start-0 anchor would fling it off-screen
      // in RTL documents
      hintEl.className =
        "bg-background text-destructive border-destructive/40 pointer-events-none fixed top-0 left-0 z-100 rounded-md border px-2 py-0.5 text-xs font-medium shadow-sm" +
        (ui?.dropHint ? ` ${ui.dropHint}` : "");
      hintEl.textContent = settings.i18n.labels.dropNotAllowed;
      document.body.appendChild(hintEl);
    }
    hintEl.style.transform = `translate3d(${snapToPixel(e.clientX + 12)}px, ${snapToPixel(e.clientY + 16)}px, 0)`;
  };

  const autoScroll = (e: PointerEvent) => {
    // Cached rect (see Surface.viewportRect) - never getBoundingClientRect per
    // move; the box is stable while the pointer is captured.
    const rect = surface?.viewportRect;
    if (!surface?.viewport || !rect) return;
    const edge = activation.autoScrollEdgePx;
    const step = activation.autoScrollMaxStepPx;
    let delta = 0;
    if (e.clientY < rect.top + edge) {
      delta = -step * ((rect.top + edge - e.clientY) / edge);
    } else if (e.clientY > rect.bottom - edge) {
      delta = step * ((e.clientY - (rect.bottom - edge)) / edge);
    }
    if (rafScroll) cancelAnimationFrame(rafScroll);
    if (delta !== 0) {
      const tick = () => {
        // Write-then-readback: the browser clamps scrollTop at the scroll
        // extent, so mirror only the APPLIED delta - otherwise parking the
        // pointer in the edge zone at the limit keeps inflating the tracked
        // value past reality and poisons every later minute mapping. When
        // parked (nothing applied), stop the loop; the next pointermove
        // restarts it.
        const before = surface!.viewport!.scrollTop;
        surface!.viewport!.scrollTop = before + delta;
        const applied = surface!.viewport!.scrollTop - before;
        if (applied === 0) return;
        // keep the tracked scrollTop in step so pointerMinutes stays a pure
        // number read (no DOM scrollTop, no forced reflow)
        surface!.scrollTop += applied;
        applyProposal(e);
        rafScroll = requestAnimationFrame(tick);
      };
      rafScroll = requestAnimationFrame(tick);
    }
  };

  const cleanup = () => {
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup", onPointerUp);
    window.removeEventListener("pointercancel", onCancel);
    window.removeEventListener("keydown", onKeyDown, true);
    if (rafScroll) cancelAnimationFrame(rafScroll);
    if (touchTimer) clearTimeout(touchTimer);
    hintEl?.remove();
    hintEl = null;
    carryEl?.remove();
    carryEl = null;
    setBodyDragging(false);
  };

  const cancel = () => {
    cleanup();
    if (active) {
      lastGestureEndedAt = performance.now();
      internals.setDrag(null);
      internals.setSlotDraft(null);
    }
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      e.stopPropagation();
      cancel();
    }
  };

  const onPointerMove = (e: PointerEvent) => {
    lastPointer = e;
    if (!active) {
      const distance = Math.hypot(e.clientX - startX, e.clientY - startY);
      if (isTouch) {
        // Long-press pending: moving past tolerance means scroll, not drag
        if (distance > activation.touchTolerancePx) cancel();
        return;
      }
      if (distance < activationDistance) return;
      activate();
    }
    applyProposal(e);
    autoScroll(e);
    updateHint(e);
    positionCarry(e);
  };

  const onPointerUp = (e: PointerEvent) => {
    cleanup();
    if (!active) return;
    lastGestureEndedAt = performance.now();

    const state = instance.getState();
    if (kind === "create") {
      const draft = state.slotDraft;
      internals.setSlotDraft(null);
      if (draft) {
        api.select({
          slot: { start: draft.start, end: draft.end, allDay: draft.allDay },
        });
        settings.onSelectSlot?.(draft);
      }
      return;
    }
    const drag = state.drag;
    internals.setDrag(null);
    if (!drag || !occurrence) return;
    const unchanged =
      drag.proposedStart.getTime() === occurrence.start.getTime() &&
      drag.proposedEnd.getTime() === occurrence.end.getTime() &&
      (drag.proposedResourceId === undefined ||
        drag.proposedResourceId === occurrence.event.resourceId);
    if (unchanged) return;
    // Commit through the one validation funnel; consumer reject = automatic
    // revert because the calendar never mutated during the gesture.
    void e;
    internals.applyProposedUpdate({
      event: occurrence.event,
      occurrence,
      start: drag.proposedStart,
      end: drag.proposedEnd,
      allDay: drag.proposedAllDay,
      resourceId: drag.proposedResourceId,
      source:
        kind === "move" ? "drag" : (kind as "resize-start" | "resize-end"),
    });
  };

  const onCancel = () => cancel();

  window.addEventListener("pointermove", onPointerMove);
  window.addEventListener("pointerup", onPointerUp);
  window.addEventListener("pointercancel", onCancel);
  window.addEventListener("keydown", onKeyDown, true);

  // Touch: long-press activation (movement past tolerance cancels above)
  if (isTouch && !active) {
    touchTimer = setTimeout(() => {
      activate();
      applyProposal(lastPointer);
    }, activation.touchDelayMs);
  }
}

/** Per-chip / per-surface pointer gesture wiring. */
function useEventCalendarGestures<TData = unknown>() {
  const instance = useEventCalendar<TData>();
  // Overlay classNames bridged from React config into the vanilla-DOM engine
  // (which must never import from the chip module - circular).
  const { classNames } = useEventCalendarViewConfig<TData>();
  const ui = useMemo(
    () => ({
      dragCarry: classNames?.dragCarry,
      dragCarryInvalid: classNames?.dragCarryInvalid,
      dropHint: classNames?.dropHint,
    }),
    [classNames],
  );

  const canDrag = useCallback(
    (segment: EventCalendarSegment<TData>) => {
      const { interactions } = instance.getState();
      const event = segment.occurrence.event;
      return interactions.drag && !event.readOnly && event.draggable !== false;
    },
    [instance],
  );

  const canResize = useCallback(
    (segment: EventCalendarSegment<TData>) => {
      const { interactions } = instance.getState();
      const event = segment.occurrence.event;
      return (
        interactions.resize && !event.readOnly && event.resizable !== false
      );
    },
    [instance],
  );

  const beginMove = useCallback(
    (e: React.PointerEvent, segment: EventCalendarSegment<TData>) => {
      if (e.button !== 0) return;
      if (!canDrag(segment)) {
        // refused, but still give feedback + broadcast on a real drag attempt
        beginBlockedGesture(instance, e.nativeEvent, segment, "move");
        return;
      }
      beginGesture({
        instance,
        kind: "move",
        origin: e.currentTarget as HTMLElement,
        startEvent: e.nativeEvent,
        segment,
        ui,
      });
    },
    [instance, canDrag, ui],
  );

  const beginResize = useCallback(
    (
      e: React.PointerEvent,
      segment: EventCalendarSegment<TData>,
      edge: "start" | "end",
    ) => {
      if (e.button !== 0) return;
      if (!canResize(segment)) {
        e.stopPropagation();
        beginBlockedGesture(instance, e.nativeEvent, segment, "resize");
        return;
      }
      e.stopPropagation();
      e.preventDefault();
      beginGesture({
        instance,
        kind: edge === "start" ? "resize-start" : "resize-end",
        origin: e.currentTarget as HTMLElement,
        startEvent: e.nativeEvent,
        segment,
        ui,
      });
    },
    [instance, canResize, ui],
  );

  const beginCreate = useCallback(
    (e: React.PointerEvent, day: Date, allDay: boolean) => {
      if (e.button !== 0) return;
      if (!instance.getState().interactions.selectSlot) return;
      beginGesture({
        instance,
        kind: "create",
        origin: e.currentTarget as HTMLElement,
        startEvent: e.nativeEvent,
        createDay: day,
        createAllDay: allDay,
        ui,
      });
    },
    [instance, ui],
  );

  return { beginMove, beginResize, beginCreate, canDrag, canResize };
}

export {
  EVENT_CALENDAR_ACTIVATION,
  markChipPress,
  useEventCalendarGestures,
  wasRecentChipPress,
  wasRecentDrag,
};
