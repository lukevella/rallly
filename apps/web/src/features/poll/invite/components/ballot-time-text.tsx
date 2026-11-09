"use client";

import * as React from "react";

const fill = "color-mix(in srgb, var(--color-primary) 50%, transparent)";
const ring = "0 0 0 1px var(--color-primary)";
const clearRing = "0 0 0 1px transparent";

/**
 * A date or time the viewer can reformat. During a change, a value that moved
 * flashes so the eye lands on it. One mounted mid change has moved too: its day
 * group is new. Colour only, so it stays the same under reduced motion.
 */
export function BallotTimeText({
  value,
  changed,
}: {
  value: string;
  changed: boolean;
}) {
  const ref = React.useRef<HTMLSpanElement>(null);
  const previous = React.useRef(changed ? null : value);

  React.useEffect(() => {
    if (previous.current === value) return;
    previous.current = value;
    if (!changed) return;
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
  }, [value, changed]);

  return (
    <span
      ref={ref}
      className="-mx-1.5 -my-0.5 inline-block rounded-lg px-1.5 py-0.5"
    >
      {value}
    </span>
  );
}
