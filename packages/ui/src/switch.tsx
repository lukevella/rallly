"use client";

import { Switch as SwitchPrimitive } from "@base-ui/react/switch";
import * as React from "react";

import { cn } from "./lib/utils";

function Switch({
  className,
  icon,
  onCheckedChange,
  ...props
}: SwitchPrimitive.Root.Props & {
  icon?: React.ReactNode;
}) {
  // The thumb keyframes only run once the user has toggled the switch, so the
  // "off" bounce does not play on mount for switches that render unchecked.
  const [interacted, setInteracted] = React.useState(false);

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
      data-interacted={interacted ? "" : undefined}
      className={cn(
        "peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full p-[3px] ring-1 ring-button-outline ring-inset focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-offset-2 data-disabled:cursor-not-allowed data-checked:bg-primary data-unchecked:bg-foreground/10 data-disabled:opacity-50",
        className,
      )}
      onCheckedChange={(checked, eventDetails) => {
        setInteracted(true);
        onCheckedChange?.(checked, eventDetails);
      }}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className="pointer-events-none flex h-full w-3.5 items-center justify-center rounded-full border border-black/10 bg-white shadow-sm ring-0 will-change-[translate] [--switch-travel:1rem] data-checked:translate-x-(--switch-travel) data-unchecked:translate-x-0 in-data-interacted:data-checked:animate-switch-thumb-on in-data-interacted:data-unchecked:animate-switch-thumb-off motion-reduce:animate-none"
      >
        {icon}
      </SwitchPrimitive.Thumb>
    </SwitchPrimitive.Root>
  );
}

export { Switch };
