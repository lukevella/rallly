"use client";

import * as React from "react";

import { cn } from "./lib/utils";
import { VariantProps, cva } from "class-variance-authority";
import { Icon, IconProps } from "./icon";

const inputVariants = cva(
  cn(
    "focus:border-primary-400 focus-visible:ring-primary-100 focus-visible:ring-2",
    "border-input placeholder:text-muted-foreground h-9 rounded border bg-gray-50 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:cursor-not-allowed disabled:opacity-50",
  ),
  {
    variants: {
      size: {
        sm: "h-7 text-xs px-1",
        md: "h-9 text-sm px-2",
        lg: "h-12 text-lg px-3",
      },
    },
    defaultVariants: {
      size: "md",
    },
  },
);

export type InputProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "size"
> &
  VariantProps<typeof inputVariants>;

const TextFieldInput = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, size, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          inputVariants({ size }),
          "group-[.text-field]:border-0 group-[.text-field]:bg-transparent group-[.text-field]:p-0 group-[.text-field]:ring-0 group-[.text-field]:ring-offset-0",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);

interface TextFieldProps extends InputProps {
  children?: React.ReactNode;
}

const TextField = React.forwardRef<HTMLDivElement, TextFieldProps>(
  ({ className, size, type, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        onClick={(e) => {
          const target = e.target as HTMLElement;
          // find an input that s a direct descendant of the target
          target.querySelector("input")?.focus();
        }}
        className={cn(
          "flex items-center",
          "text-field group",
          "focus-within:border-primary-400 focus-within:ring-primary-100 focus-within:ring-2",
          inputVariants({ size }),
          "p-0",
          className,
        )}
        {...props}
      >
        {children}
      </div>
    );
  },
);
TextField.displayName = "TextField";

function TextFieldIcon(props: IconProps) {
  return (
    <div className="pointer-events-none px-2">
      <Icon {...props} />
    </div>
  );
}

export { TextField, TextFieldIcon, TextFieldInput };
