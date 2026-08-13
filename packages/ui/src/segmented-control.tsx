"use client";

import { Radio as RadioPrimitive } from "@base-ui/react/radio";
import { RadioGroup as RadioGroupPrimitive } from "@base-ui/react/radio-group";

import { cn } from "./lib/utils";

function SegmentedControl({ className, ...props }: RadioGroupPrimitive.Props) {
  return (
    <RadioGroupPrimitive
      data-slot="segmented-control"
      className={cn(
        "inline-flex h-8 shrink-0 items-center justify-center rounded-lg border border-input bg-muted dark:bg-gray-900",
        className,
      )}
      {...props}
    />
  );
}

function SegmentedControlItem({
  className,
  ...props
}: RadioPrimitive.Root.Props) {
  return (
    <RadioPrimitive.Root
      data-slot="segmented-control-item"
      className={cn(
        "relative inline-flex h-full cursor-pointer touch-manipulation items-center justify-center rounded-lg ring-offset-background [-webkit-tap-highlight-color:transparent] before:absolute before:inset-x-0 before:-inset-y-1 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 data-checked:bg-white data-checked:ring-1 data-checked:ring-gray-200 data-unchecked:active:bg-black/5 dark:data-checked:bg-gray-800 dark:data-checked:ring-gray-700 dark:data-unchecked:active:bg-white/5",
        className,
      )}
      {...props}
    />
  );
}

export { SegmentedControl, SegmentedControlItem };
