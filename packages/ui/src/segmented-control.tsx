"use client";

import { Radio as RadioPrimitive } from "@base-ui/react/radio";
import { RadioGroup as RadioGroupPrimitive } from "@base-ui/react/radio-group";

import { cn } from "./lib/utils";

function SegmentedControl({ className, ...props }: RadioGroupPrimitive.Props) {
  return (
    <RadioGroupPrimitive
      data-slot="segmented-control"
      className={cn(
        // Matches ButtonGroup: a bordered container on the surface with a
        // filled selection, so the two controls read as one family.
        "inline-flex h-9 shrink-0 items-center justify-center gap-0.5 rounded-lg border border-input bg-background p-0.5",
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
        "relative inline-flex h-full cursor-pointer touch-manipulation select-none items-center justify-center rounded-md transition-colors [-webkit-tap-highlight-color:transparent] before:absolute before:inset-x-0 before:-inset-y-1 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring data-checked:bg-accent data-unchecked:active:bg-accent/50",
        className,
      )}
      {...props}
    />
  );
}

export { SegmentedControl, SegmentedControlItem };
