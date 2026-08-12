"use client";

import { Radio as RadioPrimitive } from "@base-ui/react/radio";
import { RadioGroup as RadioGroupPrimitive } from "@base-ui/react/radio-group";

import { cn } from "./lib/utils";

function SegmentedControl({ className, ...props }: RadioGroupPrimitive.Props) {
  return (
    <RadioGroupPrimitive
      data-slot="segmented-control"
      className={cn(
        "inline-flex shrink-0 items-center gap-0.5 rounded-lg bg-muted p-0.5",
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
        "inline-flex size-8 cursor-pointer items-center justify-center rounded-md ring-ring transition-colors focus-visible:ring-2 data-checked:bg-card",
        className,
      )}
      {...props}
    />
  );
}

export { SegmentedControl, SegmentedControlItem };
