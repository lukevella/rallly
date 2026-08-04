"use client";

import { Switch as SwitchPrimitive } from "@base-ui/react/switch";
import type * as React from "react";

import { cn } from "./lib/utils";

function Switch({
  className,
  icon,
  ...props
}: SwitchPrimitive.Root.Props & {
  icon?: React.ReactNode;
}) {
  return (
    // Rendered as a native <button> (Base UI defaults to a span) so the
    // switch is a labelable element: with nativeButton, a caller-supplied
    // `id` lands on it and `<Label htmlFor>` both names and activates it.
    // Base UI's default reserves the id for the hidden checkbox, which is
    // excluded from the accessibility tree, leaving the switch nameless.
    <SwitchPrimitive.Root
      render={<button type="button" />}
      nativeButton
      data-slot="switch"
      className={cn(
        "peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full p-0.5 ring-1 ring-button-outline ring-inset transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-offset-2 data-disabled:cursor-not-allowed data-checked:bg-primary data-unchecked:bg-muted data-disabled:opacity-50",
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className="pointer-events-none flex h-full w-4 items-center justify-center rounded-full bg-background shadow-lg ring-0 transition-transform duration-100 data-checked:translate-x-4 data-unchecked:translate-x-0 dark:bg-gray-700"
      >
        {icon}
      </SwitchPrimitive.Thumb>
    </SwitchPrimitive.Root>
  );
}

export { Switch };
