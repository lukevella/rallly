"use client";
import { Button as ButtonPrimitive } from "@base-ui/react/button";
import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";
import { Loader2Icon } from "lucide-react";
import type * as React from "react";

import { cn } from "./lib/utils";

const buttonVariants = cva(
  cn(
    "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap font-normal text-sm outline-none transition-opacity focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 active:opacity-90 active:shadow-none disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  ),
  {
    variants: {
      variant: {
        primary: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground shadow-xs hover:bg-destructive/90",
        default:
          "border border-input-border bg-input shadow-xs hover:bg-accent",
        ghost:
          "border-transparent bg-transparent text-foreground hover:bg-accent data-[state=open]:bg-accent",
        actionBar:
          "border-transparent bg-action-bar text-action-bar-foreground hover:bg-action-bar-foreground/10 data-[state=open]:bg-action-bar-foreground/20",
        link: "border-transparent text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-8 gap-x-1.5 rounded-lg px-2 text-sm",
        sm: "h-7 gap-x-1.5 rounded-md px-1.5 text-sm",
        md: "h-9 gap-x-2 rounded-md px-2 text-sm",
        lg: "h-12 gap-x-3 rounded-lg px-4 text-base",
        icon: "size-7 gap-x-1.5 rounded-lg text-sm",
        "icon-lg": "size-8 rounded-full",
        "icon-xs":
          "size-6 in-data-[slot=button-group]:rounded-lg rounded-[min(var(--radius-md),10px)] [&_svg:not([class*='size-'])]:size-3",
        "icon-sm":
          "size-7 in-data-[slot=button-group]:rounded-lg rounded-[min(var(--radius-md),12px)]",
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
  loading?: boolean;
}

const Button = ({
  className,
  loading,
  children,
  variant,
  size,
  ...props
}: ButtonPrimitive.Props &
  VariantProps<typeof buttonVariants> & { loading?: boolean }) => {
  return (
    <ButtonPrimitive
      className={cn(
        "group",
        buttonVariants({ variant, size }),
        {
          "pointer-events-none": loading,
        },
        className,
      )}
      {...props}
    >
      {loading ? (
        <Loader2Icon className="size-4 animate-spin opacity-75" />
      ) : (
        children
      )}
    </ButtonPrimitive>
  );
};

Button.displayName = "Button";

export { Button, buttonVariants };
