"use client";

import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import * as React from "react";
import type { DayButtonProps, Matcher } from "react-day-picker";
import { DayPicker } from "react-day-picker";

import { cn } from "./lib/utils";

export type MonthGridDay = DayButtonProps["day"];

const navButtonClassName = cn(
  "inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors",
  "hover:bg-muted hover:text-foreground",
  // A month with nowhere to go reads as spent: dimmed, no hover, and it
  // does not take the pointer.
  "aria-disabled:pointer-events-none aria-disabled:opacity-40",
);

/**
 * A month calendar whose cells are large enough to hold content, rather than
 * the compact one `Calendar` renders for date selection.
 *
 * Callers own what a cell contains via `renderDay`, and tint cells through
 * `modifiers` plus `modifiersClassNames`, so no domain meaning lives here.
 *
 * `onDayClick` is required: DayPicker only renders a day button when it has
 * a selection mode or a click handler, and this grid has no selection.
 *
 * The grid stretches to its container's height, so give it a parent with a
 * definite height to fill.
 */
export function MonthGrid({
  renderDay,
  className,
  classNames,
  ...props
}: Extract<React.ComponentProps<typeof DayPicker>, { mode?: undefined }> & {
  renderDay: (props: DayButtonProps) => React.ReactNode;
  onDayClick: NonNullable<React.ComponentProps<typeof DayPicker>["onDayClick"]>;
}) {
  const DayButton = React.useCallback(
    (dayProps: DayButtonProps) => <>{renderDay(dayProps)}</>,
    [renderDay],
  );

  return (
    <DayPicker
      showOutsideDays
      components={{
        DayButton,
        // DayPicker's own chevron is an unclassed svg filled with
        // currentColor, which ignores the button's text colour.
        Chevron: ({ orientation, className: chevronClassName }) => {
          const Icon =
            orientation === "left" ? ChevronLeftIcon : ChevronRightIcon;
          return <Icon className={cn("size-4", chevronClassName)} />;
        },
      }}
      className={cn("flex w-full flex-col", className)}
      classNames={{
        // The weeks share the leftover height, so the grid fills its parent.
        root: "flex min-h-0 flex-1 flex-col",
        months: "flex min-h-0 flex-1 flex-col",
        month: "flex min-h-0 flex-1 flex-col gap-2",
        month_caption:
          "flex h-8 items-center justify-center font-medium text-sm",
        nav: "flex items-center justify-between",
        // DayPicker marks an unavailable month with aria-disabled, not the
        // disabled property, so the spent state keys on that.
        button_previous: navButtonClassName,
        button_next: navButtonClassName,
        month_grid: "flex min-h-0 flex-1 flex-col",
        weekdays: "flex gap-2",
        weekday:
          "flex-1 pb-1 text-center font-normal text-muted-foreground text-xs",
        weeks: "flex min-h-0 flex-1 flex-col gap-2",
        week: "flex w-full min-h-0 flex-1 gap-2",
        // The cell owns the rounding and the border; its content fills it.
        day: "min-h-16 flex-1 overflow-hidden rounded-lg border",
        ...classNames,
      }}
      {...props}
    />
  );
}

export type { DayButtonProps as MonthGridDayProps, Matcher };
