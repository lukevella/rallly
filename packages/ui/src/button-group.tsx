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
        // Matches SegmentedControl and Tabs: a recessed track with the
        // active item floating above it.
        "inline-flex h-9 items-center gap-0.5 rounded-[10px] border border-input bg-muted p-0.5 dark:bg-gray-900",
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
        "inline-flex h-full flex-1 cursor-pointer select-none items-center justify-center whitespace-nowrap rounded-[8px] px-3 font-medium text-muted-foreground text-sm transition-colors hover:text-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring data-disabled:pointer-events-none data-pressed:bg-card data-pressed:text-foreground data-disabled:opacity-50 data-pressed:shadow-xs dark:data-pressed:bg-gray-800",
        className,
      )}
      {...props}
    />
  );
}

export { ButtonGroup, ButtonGroupItem };
