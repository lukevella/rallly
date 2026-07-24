"use client";

import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import type {
  DateValue,
  DateRangePickerProps as RADateRangePickerProps,
} from "react-aria-components";
import {
  CalendarCell,
  CalendarGrid,
  CalendarGridBody,
  CalendarGridHeader,
  CalendarHeaderCell,
  DateInput,
  DateRangePicker as DateRangePickerPrimitive,
  DateSegment,
  Dialog,
  Group,
  Heading,
  I18nProvider,
  Popover,
  Button as RAButton,
  RangeCalendar,
} from "react-aria-components";
import {
  fieldGroupClassName,
  isBidiIsolate,
  segmentClassName,
  triggerButtonClassName,
} from "./date-field-styles";
import { cn } from "./lib/utils";

export type DateRangePickerProps = Pick<
  RADateRangePickerProps<DateValue>,
  | "value"
  | "defaultValue"
  | "onChange"
  | "isDisabled"
  | "isInvalid"
  | "minValue"
  | "maxValue"
  | "firstDayOfWeek"
  // Anchors the calendar and empty segments to a month without selecting a value.
  | "placeholderValue"
  | "aria-label"
  | "aria-labelledby"
> & {
  className?: string;
  /** Months shown side by side in the popover. */
  visibleMonths?: number;
  /**
   * BCP-47 locale for the calendar and segments. Without it react-aria falls
   * back to the browser locale, ignoring the app's chosen language.
   */
  locale?: string;
};

const cellClassName = cn(
  "flex size-8 cursor-pointer select-none items-center justify-center rounded-md text-sm outline-none",
  "hover:bg-accent",
  "data-[focus-visible]:ring-[3px] data-[focus-visible]:ring-ring/50",
  // Selected span uses the pro-badge treatment: a low-opacity primary fill
  // with primary text. Squared off by default so the days read as one
  // continuous block; only the endpoints round their outer edge.
  "data-[selected]:rounded-none data-[selected]:bg-primary/10 data-[selected]:text-primary",
  "data-[selection-start]:rounded-l-md",
  "data-[selection-end]:rounded-r-md",
  "data-[outside-month]:invisible",
  "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
  "data-[unavailable]:pointer-events-none data-[unavailable]:line-through data-[unavailable]:opacity-50",
);

const navButtonClassName = cn(
  "inline-flex size-8 cursor-pointer items-center justify-center rounded-md text-muted-foreground outline-none",
  "hover:bg-accent hover:text-foreground",
  "data-[focus-visible]:ring-[3px] data-[focus-visible]:ring-ring/50",
  "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
);

/**
 * Accessible date range picker with segmented, fully styleable fields — each
 * date part is its own spinbutton (arrow keys, typeahead), so no native date
 * picker UI is involved.
 */
function DateRangePicker({
  className,
  visibleMonths = 1,
  locale,
  firstDayOfWeek,
  ...props
}: DateRangePickerProps) {
  const picker = (
    <DateRangePickerPrimitive
      {...props}
      firstDayOfWeek={firstDayOfWeek}
      className={cn("flex flex-col gap-2", className)}
    >
      <Group className={fieldGroupClassName}>
        <DateInput slot="start" className="flex items-center">
          {(segment) => (
            <DateSegment
              segment={segment}
              className={cn(
                segmentClassName,
                isBidiIsolate(segment.text) && "px-0",
              )}
            />
          )}
        </DateInput>
        <span aria-hidden className="px-1.5 text-muted-foreground">
          –
        </span>
        <DateInput slot="end" className="flex items-center">
          {(segment) => (
            <DateSegment
              segment={segment}
              className={cn(
                segmentClassName,
                isBidiIsolate(segment.text) && "px-0",
              )}
            />
          )}
        </DateInput>
        <RAButton className={triggerButtonClassName}>
          <CalendarIcon className="size-4" />
        </RAButton>
      </Group>
      <Popover
        className={cn(
          "z-50 rounded-lg border bg-popover p-3 text-popover-foreground shadow-md outline-none",
          "data-[entering]:fade-in-0 data-[entering]:animate-in",
          "data-[exiting]:fade-out-0 data-[exiting]:animate-out",
        )}
      >
        <Dialog className="outline-none">
          {/* firstDayOfWeek isn't forwarded from the picker to its calendar,
              so it has to be passed here too. */}
          <RangeCalendar
            firstDayOfWeek={firstDayOfWeek}
            visibleDuration={{ months: visibleMonths }}
          >
            <header className="relative flex items-center justify-between pb-3">
              <RAButton slot="previous" className={navButtonClassName}>
                <ChevronLeftIcon className="size-4" />
              </RAButton>
              <Heading className="font-medium text-sm" />
              <RAButton slot="next" className={navButtonClassName}>
                <ChevronRightIcon className="size-4" />
              </RAButton>
            </header>
            <div className="flex flex-col gap-4 md:flex-row">
              {Array.from({ length: visibleMonths }, (_, index) => (
                <CalendarGrid
                  // biome-ignore lint/suspicious/noArrayIndexKey: month offset is the identity
                  key={index}
                  offset={index === 0 ? undefined : { months: index }}
                  className="border-collapse"
                >
                  <CalendarGridHeader>
                    {(day) => (
                      <CalendarHeaderCell className="size-8 font-normal text-muted-foreground text-xs">
                        {day}
                      </CalendarHeaderCell>
                    )}
                  </CalendarGridHeader>
                  <CalendarGridBody>
                    {(date) => (
                      <CalendarCell date={date} className={cellClassName} />
                    )}
                  </CalendarGridBody>
                </CalendarGrid>
              ))}
            </div>
          </RangeCalendar>
        </Dialog>
      </Popover>
    </DateRangePickerPrimitive>
  );

  // react-aria reads locale from context, so wrap rather than prop-drill.
  return locale ? (
    <I18nProvider locale={locale}>{picker}</I18nProvider>
  ) : (
    picker
  );
}

export type { DateValue };
export { DateRangePicker };
