"use client";

import { Progress as ProgressPrimitive } from "@base-ui/react/progress";

import { cn } from "./lib/utils";

function Progress({
  className,
  indicatorClassName,
  value,
  ...props
}: ProgressPrimitive.Root.Props & { indicatorClassName?: string }) {
  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      value={value}
      className={cn(
        "relative h-1 w-full overflow-hidden rounded-full bg-secondary",
        className,
      )}
      {...props}
    >
      <ProgressPrimitive.Track
        data-slot="progress-track"
        className="h-full w-full"
      >
        <ProgressPrimitive.Indicator
          data-slot="progress-indicator"
          className={cn(
            "h-full bg-linear-to-r from-primary/50 to-primary transition-all",
            indicatorClassName,
          )}
        />
      </ProgressPrimitive.Track>
    </ProgressPrimitive.Root>
  );
}

export { Progress };
