import * as React from "react";

import { cn } from "./lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "border-input ring-offset-input-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-9 w-full rounded border bg-transparent px-2 file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:border-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
