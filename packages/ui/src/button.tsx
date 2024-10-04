"use client";
import { Slot } from "@radix-ui/react-slot";
import { cva, VariantProps } from "class-variance-authority";
import * as React from "react";
import { Loader2Icon } from "lucide-react";
import { cn } from "./lib/utils";

const buttonVariants = cva(
  cn(
    "inline-flex border active:shadow-none hover:shadow-sm transition-colors font-medium disabled:pointer-events-none select-none disabled:opacity-50 items-center justify-center whitespace-nowrap border",
  ),
  {
    variants: {
      variant: {
        primary:
          "bg-primary disabled:bg-gray-400 disabled:border-transparent text-primary-foreground hover:bg-primary-700 active:bg-primary-800",
        destructive:
          "bg-destructive text-destructive-foreground active:bg-destructive border-destructive hover:bg-destructive/90",
        default:
          "data-[state=open]:bg-gray-100 hover:bg-gray-100 active:bg-gray-200 bg-white",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost:
          "border-transparent bg-transparent text-gray-800 hover:bg-gray-500/10 active:bg-gray-500/20",
        link: "underline-offset-4 border-transparent hover:underline text-primary",
      },
      size: {
        default: "h-8 px-2 gap-x-1.5 text-sm rounded-md",
        sm: "h-7 text-sm px-1.5 gap-x-1.5 rounded-md",
        lg: "h-11 text-base gap-x-3 px-4 rounded-xl",
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
