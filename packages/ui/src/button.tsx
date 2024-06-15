"use client";
import { Slot } from "@radix-ui/react-slot";
import { cva, VariantProps } from "class-variance-authority";
import * as React from "react";
import { Loader2Icon } from "lucide-react";
import { cn } from "./lib/utils";

const buttonVariants = cva(
  cn(
    "inline-flex border font-medium disabled:pointer-events-none select-none disabled:opacity-50 items-center justify-center whitespace-nowrap border",
    "focus-visible:ring-offset-input-background",
    "focus:shadow-none",
  ),
  {
    variants: {
      variant: {
        primary:
          "border-primary-700 bg-primary disabled:bg-gray-400 disabled:border-transparent text-primary-foreground shadow-sm focus:bg-primary-500",
        destructive:
          "bg-destructive shadow-sm text-destructive-foreground focus-visible:ring-offset-1 active:bg-destructive border-destructive hover:bg-destructive/90",
        default:
          "ring-1 ring-inset ring-white/25 data-[state=open]:bg-gray-100 focus:border-gray-300 focus:bg-gray-200 hover:bg-gray-100 bg-gray-50",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost:
          "border-transparent bg-transparent text-gray-800 focus:border-gray-300 focus:bg-gray-200",
        link: "underline-offset-4 border-transparent hover:underline text-primary",
      },
      size: {
        default: "h-9 px-2.5 pr-3 gap-x-2 text-sm rounded-md",
        sm: "h-7 text-sm px-1.5 gap-x-1.5 rounded-md",
        lg: "h-11 text-base gap-x-3 px-4 rounded-md",
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
