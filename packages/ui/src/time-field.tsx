"use client";

import type {
  TimeFieldProps as RATimeFieldProps,
  TimeValue,
} from "react-aria-components";
import {
  DateInput,
  DateSegment,
  I18nProvider,
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
  /**
   * BCP-47 locale for segment order and the AM/PM field. Without it react-aria
   * falls back to the browser locale, ignoring the app's chosen language.
   */
  locale?: string;
};

/**
 * Accessible time input with segmented, fully styleable fields — each part is
 * its own spinbutton (arrow keys, typeahead), so no native time picker UI is
 * involved. Segment order and the AM/PM field follow the resolved locale.
 */
function TimeField({ className, locale, ...props }: TimeFieldProps) {
  const field = (
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

  // react-aria reads locale from context, so wrap rather than prop-drill.
  return locale ? <I18nProvider locale={locale}>{field}</I18nProvider> : field;
}

export type { TimeValue };
export { TimeField };
