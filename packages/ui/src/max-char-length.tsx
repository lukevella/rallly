"use client";

import { cn } from "./lib/utils";

// Stay out of the way until the user is within ~15% of the cap.
const VISIBILITY_THRESHOLD = 0.85;

const SIZE = 16;
const STROKE_WIDTH = 2;
const RADIUS = (SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function MaxCharLength({
  length,
  maxLength,
  label,
  className,
}: {
  length: number;
  maxLength: number;
  /** Localized description of the remaining count (e.g. "12 characters
   * remaining"). Announced to screen readers while the indicator is shown. */
  label: string;
  className?: string;
}) {
  const remaining = maxLength - length;
  const atLimit = remaining <= 0;
  const show = length >= maxLength * VISIBILITY_THRESHOLD;
  const progress = Math.min(length / maxLength, 1);

  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <span aria-live="polite" className="sr-only">
        {show ? label : null}
      </span>
      {show ? (
        <>
          <svg
            aria-hidden="true"
            width={SIZE}
            height={SIZE}
            viewBox={`0 0 ${SIZE} ${SIZE}`}
            className="-rotate-90"
          >
            <circle
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={RADIUS}
              fill="none"
              strokeWidth={STROKE_WIDTH}
              className="stroke-border"
            />
            <circle
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={RADIUS}
              fill="none"
              strokeWidth={STROKE_WIDTH}
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={CIRCUMFERENCE * (1 - progress)}
              className={atLimit ? "stroke-destructive" : "stroke-primary"}
            />
          </svg>
          {/* The remaining count doubles as the non-color at-limit signal: it
           * reads 0 (or negative) exactly when the ring is full. */}
          <span
            aria-hidden="true"
            className={cn(
              "text-xs tabular-nums",
              atLimit
                ? "font-medium text-destructive"
                : "text-muted-foreground",
            )}
          >
            {remaining}
          </span>
        </>
      ) : null}
    </span>
  );
}
