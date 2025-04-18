"use client";
import { Slot } from "@radix-ui/react-slot";
import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";
import { Loader2Icon } from "lucide-react";
import * as React from "react";

import { cn } from "./lib/utils";

const buttonVariants = cva(
  cn(
    "inline-flex border text-shadow font-medium disabled:pointer-events-none select-none disabled:opacity-50 items-center justify-center whitespace-nowrap border",
    "focus-visible:shadow-none",
  ),
  {
    variants: {
      variant: {
        primary:
          "focus-visible:ring-offset-1 border-primary bg-primary hover:bg-primary-500 disabled:bg-gray-400 disabled:border-transparent text-white",
        destructive:
          "focus-visible:ring-offset-1 bg-destructive shadow-sm text-destructive-foreground active:bg-destructive border-destructive hover:bg-destructive/90",
        default: "focus-visible:ring-offset-1 hover:bg-gray-50 bg-white",
        secondary:
          "focus-visible:ring-offset-1 border-secondary bg-secondary hover:bg-secondary/80 text-secondary-foreground",
        ghost:
          "border-transparent bg-transparent data-[state=open]:bg-gray-500/20 text-gray-800 hover:bg-gray-500/10 active:bg-gray-500/20",
        actionBar:
          "border-transparent bg-transparent data-[state=open]:bg-gray-500/20 text-gray-800 hover:bg-gray-700 active:bg-gray-700/50",
        link: "underline-offset-4 border-transparent hover:underline text-primary",
      },
      size: {
        default: "h-9 px-2.5 gap-x-2 text-sm rounded-md",
        sm: "h-8 text-sm px-2 gap-x-1.5 rounded-md",
        lg: "h-12 text-base gap-x-3 px-4 rounded-lg",
        icon: "size-7 text-sm gap-x-1.5 rounded-md",
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
