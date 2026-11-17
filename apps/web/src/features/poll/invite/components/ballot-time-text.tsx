"use client";

import * as React from "react";

const fill = "color-mix(in srgb, var(--color-primary) 50%, transparent)";
const ring = "0 0 0 1px var(--color-primary)";
const clearRing = "0 0 0 1px transparent";

/** How long after a change a value still counts as moved by it. */
const changeWindowMs = 300;

/** A time as text, or a day of a date poll as aligned number and weekday. */
export type BallotTimeValue = string | { day: string; weekday: string };

/**
 * A date or time the viewer can reformat. During a change, a value that moved
 * flashes so the eye lands on it. One mounted mid change has moved too: its day
 * group is new; one mounted later (Edit, showing past times) has not. Colour
 * only, so it stays the same under reduced motion.
 */
export function BallotTimeText({
  value,
  changedAt,
}: {
  value: BallotTimeValue;
  /** When the viewer last changed the time zone or format. */
  changedAt?: React.RefObject<number>;
}) {
  const ref = React.useRef<HTMLSpanElement>(null);
  const key =
    typeof value === "string" ? value : `${value.day} ${value.weekday}`;
  const previous = React.useRef<string | null>(null);

  React.useEffect(() => {
    if (previous.current === key) return;
    previous.current = key;
    if (!changedAt || performance.now() - changedAt.current > changeWindowMs) {
      return;
    }
    ref.current?.animate(
      [
        { backgroundColor: fill, boxShadow: ring, offset: 0 },
        { backgroundColor: fill, boxShadow: ring, offset: 0.3 },
        {
          backgroundColor: "transparent",
          boxShadow: clearRing,
          offset: 1,
        },
      ],
      { duration: 800, easing: "ease-out" },
    );
  }, [key, changedAt]);

  return (
    <span
      ref={ref}
      className="-mx-1.5 -my-0.5 inline-block rounded-lg px-1.5 py-0.5"
    >
      {typeof value === "string" ? (
        value
      ) : (
        <span className="flex gap-2">
          {/* Fixed width so the numbers line up down the list. */}
          <span className="min-w-[2ch] text-end tabular-nums">{value.day}</span>
          <span className="text-muted-foreground">{value.weekday}</span>
        </span>
      )}
    </span>
  );
}
