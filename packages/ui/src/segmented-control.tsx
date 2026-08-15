"use client";

import { Radio as RadioPrimitive } from "@base-ui/react/radio";
import { RadioGroup as RadioGroupPrimitive } from "@base-ui/react/radio-group";

import { cn } from "./lib/utils";

function SegmentedControl({ className, ...props }: RadioGroupPrimitive.Props) {
  return (
    <RadioGroupPrimitive
      data-slot="segmented-control"
      className={cn(
        "inline-flex h-8 shrink-0 items-center justify-center rounded-lg border border-input/60 bg-muted p-0.5",
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
        "relative inline-flex h-full cursor-pointer touch-manipulation items-center justify-center rounded-md ring-offset-background [-webkit-tap-highlight-color:transparent] before:absolute before:inset-x-0 before:-inset-y-1 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 data-checked:bg-white data-checked:shadow-sm data-unchecked:active:bg-black/5 data-unchecked:hover:bg-white/50 dark:data-checked:bg-gray-700 dark:data-checked:ring-1 dark:data-checked:ring-gray-600 dark:data-unchecked:active:bg-white/10 dark:data-unchecked:hover:bg-white/5",
        className,
      )}
      {...props}
    />
  );
}

export { SegmentedControl, SegmentedControlItem };
