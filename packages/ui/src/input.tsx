import * as React from "react";

import { cn } from "./lib/utils";
import { cva } from "class-variance-authority";

export type InputProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "size"
> & {
  size?: "sm" | "md" | "lg";
  error?: boolean;
};

const inputVariants = cva(
  cn(
    "w-full focus-visible:border-primary-400 focus-visible:ring-offset-1 focus-visible:outline-none focus-visible:ring-primary-200 focus-visible:ring-1",
    "border-input placeholder:text-muted-foreground h-9 rounded border bg-gray-50 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:cursor-not-allowed disabled:opacity-50",
  ),
  {
    variants: {
      size: {
        sm: "h-7 text-xs px-1",
        md: "h-9 text-sm px-2",
        lg: "h-12 text-lg px-3",
      },
      variant: {
        default: "border-primary-400 focus-visible:border-primary-400",
        error: "border-rose-400 focus-visible:border-rose-400",
        ghost: "border-transparent focus-visible:border-primary-400",
      },
    },
    defaultVariants: {
      size: "md",
    },
  },
);

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, size, type, error, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          inputVariants({ size }),
          error
            ? "focus-visible:border-rose-400  focus-visible:ring-rose-100"
            : "focus-visible:border-primary-400  focus-visible:ring-primary-100",
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
