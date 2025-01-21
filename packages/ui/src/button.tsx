"use client";
import { Slot } from "@radix-ui/react-slot";
import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";
import { Loader2Icon } from "lucide-react";
import * as React from "react";

import { cn } from "./lib/utils";

const buttonVariants = cva(
  cn(
    "inline-flex border font-medium disabled:pointer-events-none select-none disabled:opacity-50 items-center justify-center whitespace-nowrap border",
    "focus:shadow-none focus-visible:ring-2 focus-visible:ring-ring",
  ),
  {
    variants: {
      variant: {
        primary:
          "focus:ring-offset-1 border-primary-700 bg-primary hover:bg-primary-700 disabled:bg-gray-400 active:bg-primary-800 disabled:border-transparent text-primary-foreground shadow-sm",
        destructive:
          "focus:ring-offset-1 bg-destructive shadow-sm text-destructive-foreground active:bg-destructive border-destructive hover:bg-destructive/90",
        default:
          "focus:ring-offset-1 hover:bg-gray-100 bg-gray-50 active:bg-gray-200",
        secondary:
          "focus:ring-offset-1 bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost:
          "border-transparent bg-transparent data-[state=open]:bg-gray-500/20 text-gray-800 hover:bg-gray-500/10 active:bg-gray-500/20",
        link: "underline-offset-4 border-transparent hover:underline text-primary",
      },
      size: {
        default: "h-9 pl-2.5 pr-3 gap-x-2 text-sm rounded-md",
        sm: "h-7 text-sm px-1.5 gap-x-1.5 rounded-md",
        lg: "h-12 text-base gap-x-3 px-4 rounded-md",
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
