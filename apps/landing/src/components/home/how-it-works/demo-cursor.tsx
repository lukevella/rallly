"use client";

import * as m from "motion/react-m";
import * as React from "react";
import type { Playback } from "./motion";
import { EASE_OUT, EXIT } from "./motion";

// One pointer appears to drive the whole walkthrough. Each step owns its own
// cursor, but they are choreographed as a single actor: every cursor sweeps
// in from the left, clicks its way through the step, and leaves through the
// right edge — and the next step's cursor enters at the same height the
// previous one left at, so the eye reads one cursor crossing the cards.
//
// Stops are element refs rather than coordinates because the demos are
// fluid: the overlay measures each target against itself, so the cursor
// lands on the real pixels at any card width.

// How far past the stage edge the cursor parks, so entering and leaving read
// as coming from and going to somewhere, not popping at the border.
const OFFSTAGE = 32;
// The beat between the last click and departure: long enough to see the
// click land, short enough that leaving still belongs to the same gesture.
const HOLD = 0.12;
const EXIT_DUR = 0.35;
// The click dip. Kept shorter than the fastest hop between stops so
// back-to-back clicks never overlap.
const DIP = 0.14;

export type CursorStop = {
  ref: React.RefObject<HTMLElement | null>;
  // Seconds into the step's sequence when the cursor arrives here.
  at: number;
  click?: boolean;
};

export const DemoCursor = ({
  playback,
  stops,
  enterY,
}: {
  playback: Playback;
  stops: CursorStop[];
  // Stage y where the cursor crosses into frame — the previous step's exit
  // height, for continuity. Defaults to the first stop's own height.
  enterY?: number;
}) => {
  const overlayRef = React.useRef<HTMLDivElement>(null);
  const [frame, setFrame] = React.useState<{
    width: number;
    points: { x: number; y: number }[];
  } | null>(null);

  React.useLayoutEffect(() => {
    const overlay = overlayRef.current;
    if (!overlay) {
      return;
    }
    const measure = () => {
      const o = overlay.getBoundingClientRect();
      if (o.width === 0) {
        return;
      }
      const points = stops.map((stop) => {
        const r = stop.ref.current?.getBoundingClientRect();
        return r
          ? { x: r.x + r.width / 2 - o.x, y: r.y + r.height / 2 - o.y }
          : null;
      });
      if (points.every((point) => point !== null)) {
        setFrame({ width: o.width, points });
      }
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(overlay);
    return () => observer.disconnect();
  }, [stops]);

  const path = React.useMemo(() => {
    if (!frame) {
      return null;
    }
    const { width, points } = frame;
    const last = stops[stops.length - 1];
    const lastPoint = points[points.length - 1];
    const total = last.at + HOLD + EXIT_DUR;
    // Enter offstage left, visit every stop, dwell, leave offstage right.
    const xs = [
      -OFFSTAGE,
      ...points.map((p) => p.x),
      lastPoint.x,
      width + OFFSTAGE,
    ];
    const ys = [
      enterY ?? points[0].y,
      ...points.map((p) => p.y),
      lastPoint.y,
      lastPoint.y,
    ];
    const times = [
      0,
      ...stops.map((stop) => stop.at / total),
      (last.at + HOLD) / total,
      1,
    ];
    // A dip per click, anchored so the scale sits at rest between them.
    const scales = [1];
    const scaleTimes = [0];
    for (const stop of stops) {
      if (stop.click) {
        scales.push(1, 0.85, 1);
        scaleTimes.push(
          stop.at / total,
          (stop.at + DIP * 0.4) / total,
          (stop.at + DIP) / total,
        );
      }
    }
    scales.push(1);
    scaleTimes.push(1);
    return { xs, ys, times, scales, scaleTimes, total };
  }, [frame, stops, enterY]);

  return (
    <div
      ref={overlayRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      {path ? (
        <m.div
          className="absolute top-0 left-0"
          initial={false}
          animate={
            playback === "play"
              ? { x: path.xs, y: path.ys, scale: path.scales }
              : playback === "done"
                ? // The finished frame includes the cursor having left.
                  {
                    x: path.xs[path.xs.length - 1],
                    y: path.ys[path.ys.length - 1],
                    scale: 1,
                  }
                : { x: path.xs[0], y: path.ys[0], scale: 1 }
          }
          transition={
            playback === "done"
              ? { duration: 0 }
              : playback === "play"
                ? {
                    x: {
                      duration: path.total,
                      times: path.times,
                      ease: EASE_OUT,
                    },
                    y: {
                      duration: path.total,
                      times: path.times,
                      ease: EASE_OUT,
                    },
                    scale: {
                      duration: path.total,
                      times: path.scaleTimes,
                      ease: EASE_OUT,
                    },
                  }
                : EXIT
          }
        >
          <CursorIcon />
        </m.div>
      ) : null}
    </div>
  );
};

const CursorIcon = () => (
  <svg
    aria-hidden="true"
    viewBox="0 0 12 12"
    className="size-4 fill-gray-900 stroke-white drop-shadow-sm"
    strokeWidth="1"
  >
    <path d="M1 1 L1 10 L3.5 7.6 L5.3 11 L7 10.1 L5.2 6.9 L8.6 6.7 Z" />
  </svg>
);
