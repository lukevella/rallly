import type * as React from "react";
import { cn } from "./lib/utils";

function Input({
  className,
  type,
  large,
  ...props
}: React.ComponentProps<"input"> & { large?: boolean }) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "w-full min-w-0 border border-input bg-transparent shadow-xs outline-none transition-[color,box-shadow] selection:bg-primary selection:text-primary-foreground file:inline-flex file:h-7 file:border-0 file:bg-transparent file:font-medium file:text-foreground file:text-sm placeholder:text-muted-foreground disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30",
        "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
        "aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40",
        large
          ? "h-12 rounded-lg px-3 text-base"
          : "h-8 rounded-lg px-2.5 py-1 text-sm",
        className,
      )}
      {...props}
    />
  );
}

export type InputProps = React.ComponentProps<typeof Input>;

export { Input };
