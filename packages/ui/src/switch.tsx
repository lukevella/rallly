"use client";

import * as SwitchPrimitives from "@radix-ui/react-switch";
import * as React from "react";

import { cn } from "@rallly/ui";

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root> & {
    icon?: React.ReactNode;
  }
>(({ className, ...props }, ref) => (
  <SwitchPrimitives.Root
    className={cn(
      "peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-transparent p-0.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-green-600 data-[state=unchecked]:bg-gray-200",
      className,
    )}
    {...props}
    ref={ref}
  >
    <SwitchPrimitives.Thumb
      className={cn(
        "pointer-events-none flex h-full w-4 items-center justify-center rounded-full bg-white shadow-lg ring-0 transition-transform duration-100 data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0",
      )}
    >
      {props.icon}
    </SwitchPrimitives.Thumb>
  </SwitchPrimitives.Root>
));
Switch.displayName = SwitchPrimitives.Root.displayName;

export { Switch };
