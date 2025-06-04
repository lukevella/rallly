"use client";
import { Slot } from "@radix-ui/react-slot";
import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";
import { Loader2Icon } from "lucide-react";
import * as React from "react";

import { cn } from "./lib/utils";

const buttonVariants = cva(
  cn(
    "inline-flex select-none items-center justify-center whitespace-nowrap border border font-medium text-shadow disabled:pointer-events-none disabled:opacity-50",
    "focus-visible:shadow-none",
  ),
  {
    variants: {
      variant: {
        primary:
          "border-primary bg-primary text-white hover:bg-primary-500 focus-visible:ring-offset-1 disabled:border-transparent disabled:bg-gray-400",
        destructive:
          "border-destructive bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90 focus-visible:ring-offset-1 active:bg-destructive",
        default: "bg-white hover:bg-gray-50 focus-visible:ring-offset-1",
        secondary:
          "border-secondary bg-secondary text-secondary-foreground hover:bg-secondary/80 focus-visible:ring-offset-1",
        ghost:
          "border-transparent bg-transparent text-gray-800 hover:bg-gray-500/10 active:bg-gray-500/20 data-[state=open]:bg-gray-500/20",
        actionBar:
          "border-transparent bg-transparent text-white hover:bg-gray-700 active:bg-gray-700/50 data-[state=open]:bg-gray-500/20",
        link: "border-transparent text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 gap-x-2 rounded-md px-2.5 text-sm",
        sm: "h-8 gap-x-1.5 rounded-md px-2 text-sm",
        lg: "h-12 gap-x-3 rounded-lg px-4 text-base",
        icon: "size-7 gap-x-1.5 rounded-md text-sm",
        "icon-lg": "size-8 rounded-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      loading,
      children,
      variant,
      type = "button",
      size,
      asChild = false,
      ...props
    },
    ref,
  ) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(
          "group",
          buttonVariants({ variant, size }),
          {
            "pointer-events-none": loading,
          },
          className,
        )}
        ref={ref}
        type={type}
        {...props}
      >
        {loading ? (
          <Loader2Icon className="size-4 animate-spin opacity-75" />
        ) : (
          children
        )}
      </Comp>
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
