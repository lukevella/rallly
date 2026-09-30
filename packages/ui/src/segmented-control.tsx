"use client";

import { Radio as RadioPrimitive } from "@base-ui/react/radio";
import { RadioGroup as RadioGroupPrimitive } from "@base-ui/react/radio-group";

import { cn } from "./lib/utils";

function SegmentedControl({ className, ...props }: RadioGroupPrimitive.Props) {
  return (
    <RadioGroupPrimitive
      data-slot="segmented-control"
      className={cn(
        // A recessed track with the selection floating above it. Tabs use
        // the same treatment, so the two read as one family.
        "inline-flex h-9 shrink-0 items-center justify-center gap-0.5 rounded-[10px] border border-input bg-muted p-0.5 dark:bg-gray-900",
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
        "relative inline-flex h-full cursor-pointer touch-manipulation select-none items-center justify-center rounded-[8px] transition-colors [-webkit-tap-highlight-color:transparent] before:absolute before:inset-x-0 before:-inset-y-1 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring data-checked:bg-card data-checked:shadow-xs dark:data-checked:bg-gray-800",
        className,
      )}
      {...props}
    />
  );
}

export { SegmentedControl, SegmentedControlItem };
