"use client";

import type {
  TimeFieldProps as RATimeFieldProps,
  TimeValue,
} from "react-aria-components";
import {
  DateInput,
  DateSegment,
  TimeField as TimeFieldPrimitive,
} from "react-aria-components";
import {
  fieldGroupClassName,
  isBidiIsolate,
  segmentClassName,
} from "./date-field-styles";
import { cn } from "./lib/utils";

export type TimeFieldProps = Pick<
  RATimeFieldProps<TimeValue>,
  | "value"
  | "defaultValue"
  | "onChange"
  | "isDisabled"
  | "isInvalid"
  | "hourCycle"
  | "granularity"
  | "aria-label"
  | "aria-labelledby"
> & {
  className?: string;
};

/**
 * Accessible time input with segmented, fully styleable fields — each part is
 * its own spinbutton (arrow keys, typeahead), so no native time picker UI is
 * involved. Segment order and the AM/PM field follow the locale from context
 * (a LocaleProvider near the app root).
 */
function TimeField({ className, ...props }: TimeFieldProps) {
  return (
    <TimeFieldPrimitive {...props}>
      {/* pr-2 balances the group's pr-1, which is sized for the date picker's
          trailing button; the left inset stays shared so both fields line up. */}
      <DateInput className={cn(fieldGroupClassName, "pr-2", className)}>
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
    </TimeFieldPrimitive>
  );
}

export type { TimeValue };
export { TimeField };
