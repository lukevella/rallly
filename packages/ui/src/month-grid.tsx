"use client";

import * as React from "react";
import type { DayButtonProps, Matcher } from "react-day-picker";
import { DayPicker } from "react-day-picker";

import { cn } from "./lib/utils";

export type MonthGridDay = DayButtonProps["day"];

/**
 * A month calendar whose cells are large enough to hold content, rather than
 * the compact one `Calendar` renders for date selection.
 *
 * Callers own what a cell contains via `renderDay`, and tint cells through
 * `modifiers` plus `modifiersClassNames`, so no domain meaning lives here.
 *
 * `onDayClick` is required: DayPicker only renders a day button when it has
 * a selection mode or a click handler, and this grid has no selection.
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
      components={{ DayButton }}
      className={cn("w-full", className)}
      classNames={{
        months: "flex flex-col gap-4",
        month: "flex flex-col gap-3",
        month_caption:
          "flex h-8 items-center justify-center font-medium text-sm",
        nav: "flex items-center justify-between",
        button_previous:
          "inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted disabled:opacity-40",
        button_next:
          "inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted disabled:opacity-40",
        month_grid: "w-full border-separate border-spacing-1",
        weekdays: "flex",
        weekday:
          "flex-1 pb-1 text-center font-normal text-muted-foreground text-xs",
        week: "flex w-full",
        // The cell owns the rounding and the border; its content fills it.
        day: "h-16 flex-1 overflow-hidden rounded-lg border",
        ...classNames,
      }}
      {...props}
    />
  );
}

export type { DayButtonProps as MonthGridDayProps, Matcher };
