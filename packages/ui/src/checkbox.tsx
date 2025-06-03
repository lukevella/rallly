"use client";

import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { Check, Minus } from "lucide-react";
import * as React from "react";

import { cn } from "./lib/utils";

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, checked, ...props }, ref) => {
  return (
    <CheckboxPrimitive.Root
      ref={ref}
      className={cn(
        "peer size-5 shrink-0 rounded-md border border-gray-300 focus-visible:outline-none focus-visible:ring-1 active:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:border-primary-700 data-[state=indeterminate]:border-primary data-[state=checked]:bg-primary data-[state=indeterminate]:bg-primary data-[state=checked]:text-primary-foreground data-[state=indeterminate]:text-primary-foreground data-[state=unchecked]:active:border-gray-300 data-[state=checked]:active:bg-primary-700 data-[state=indeterminate]:active:bg-primary-700",
        className,
      )}
      checked={checked}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        className={cn("flex items-center justify-center text-current")}
      >
        {checked === "indeterminate" ? (
          <Minus className="size-4" />
        ) : (
          <Check className="size-4" />
        )}
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
});
Checkbox.displayName = CheckboxPrimitive.Root.displayName;

export { Checkbox };
