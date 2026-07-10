"use client";

import { Radio as RadioPrimitive } from "@base-ui/react/radio";
import { RadioGroup as RadioGroupPrimitive } from "@base-ui/react/radio-group";

import { cn } from "./lib/utils";

function RadioPills({ className, ...props }: RadioGroupPrimitive.Props) {
  return (
    <RadioGroupPrimitive
      data-slot="radio-pills"
      className={cn("display flex items-center gap-x-2", className)}
      {...props}
    />
  );
}

function RadioPillsItem({ className, ...props }: RadioPrimitive.Root.Props) {
  return (
    <RadioPrimitive.Root
      data-slot="radio-pills-item"
      className={cn(
        "inline-flex h-8 cursor-pointer items-center rounded-full border px-3 font-medium text-muted-foreground text-sm data-checked:border-primary data-checked:text-primary data-unchecked:hover:text-foreground",
        className,
      )}
      {...props}
    />
  );
}

export { RadioPills as RadioCards, RadioPillsItem as RadioCardsItem };
