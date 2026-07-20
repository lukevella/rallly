"use client";

import { Toggle } from "@base-ui/react/toggle";
import { ToggleGroup as ToggleGroupPrimitive } from "@base-ui/react/toggle-group";

import { cn } from "./lib/utils";

/**
 * A segmented control: a group of joined buttons where exactly one is
 * selected. Built on Base UI's single-select toggle group, so items are
 * real buttons with aria-pressed state and arrow key navigation.
 */
function ButtonGroup({
  className,
  value,
  onValueChange,
  ...props
}: Omit<ToggleGroupPrimitive.Props, "value" | "onValueChange" | "multiple"> & {
  value?: string;
  onValueChange?: (value: string) => void;
}) {
  return (
    <ToggleGroupPrimitive
      data-slot="button-group"
      value={value !== undefined ? [value] : undefined}
      onValueChange={(groupValue) => {
        // Ignore deselection so one item is always active
        if (groupValue[0] !== undefined) {
          onValueChange?.(groupValue[0]);
        }
      }}
      className={cn(
        "inline-flex h-9 items-center gap-0.5 rounded-lg border border-input bg-background p-0.5",
        className,
      )}
      {...props}
    />
  );
}

function ButtonGroupItem({ className, ...props }: Toggle.Props) {
  return (
    <Toggle
      data-slot="button-group-item"
      className={cn(
        "inline-flex h-full flex-1 cursor-pointer select-none items-center justify-center whitespace-nowrap rounded-md px-3 font-medium text-muted-foreground text-sm transition-colors hover:text-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring data-disabled:pointer-events-none data-pressed:bg-accent data-pressed:text-foreground data-disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

export { ButtonGroup, ButtonGroupItem };
