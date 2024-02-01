import * as React from "react";

import { cn } from "@rallly/ui";
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
    "border-input placeholder:text-muted-foreground flex h-9 w-full rounded border bg-transparent file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:cursor-not-allowed disabled:opacity-50",
  ),
  {
    variants: {
      size: {
        sm: "h-6 text-sm px-1",
        md: "h-9 text-base px-2",
        lg: "h-12 text-lg px-3",
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
          "focus-visible:ring-offset-input-background focus-visible:ring-1 focus-visible:ring-offset-1",
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
