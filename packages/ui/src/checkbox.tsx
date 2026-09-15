"use client";

import { Checkbox as CheckboxPrimitive } from "@base-ui/react/checkbox";
import { CheckIcon } from "lucide-react";

import { cn } from "./lib/utils";

function Checkbox({ className, ...props }: CheckboxPrimitive.Root.Props) {
  return (
    // Rendered as a native <button> for the same reason as Switch: a
    // caller-supplied `id` then lands on the labelable element, so
    // `<Label htmlFor>` names and toggles it.
    <CheckboxPrimitive.Root
      render={<button type="button" />}
      nativeButton
      data-slot="checkbox"
      className={cn(
        "peer flex size-4 shrink-0 cursor-pointer items-center justify-center rounded-[4px] border border-input bg-background/80 shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 data-disabled:cursor-not-allowed data-checked:border-primary data-checked:bg-primary data-checked:text-primary-foreground data-disabled:opacity-50 dark:bg-foreground/5 dark:aria-invalid:ring-destructive/40",
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="flex items-center justify-center text-current"
      >
        <CheckIcon className="size-3.5" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}

export { Checkbox };
