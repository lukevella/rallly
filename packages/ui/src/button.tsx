"use client";
import { Slot } from "@radix-ui/react-slot";
import { Loader2Icon } from "lucide-react";
import { cva, VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@rallly/ui";

const buttonVariants = cva(
  cn(
    "inline-flex shadow-[inset_0_0.5px_0_0.5px_rgb(255,255,255,0.4),_inset_0_-0.5px_0_0.5px_rgb(0,0,0,0.1)] border font-medium disabled:text-muted-foreground disabled:bg-muted disabled:pointer-events-none select-none items-center justify-center whitespace-nowrap rounded-md border",
    "focus-visible:ring-offset-input-background focus-visible:border-primary-400 focus-visible:ring-2 focus-visible:ring-indigo-100",
  ),
  {
    variants: {
      variant: {
        primary:
          "border-transparent bg-primary text-white focus:ring-offset-1 shadow-sm hover:bg-primary-500 active:bg-primary-700",
        destructive:
          "bg-destructive text-destructive-foreground focus:ring-offset-1 active:bg-destructive border-destructive hover:bg-destructive/90",
        default:
          "rounded-md px-3.5 shadow-inner py-2.5 data-[state=open]:shadow-none data-[state=open]:bg-gray-100 active:bg-gray-200 focus:border-gray-300 hover:bg-gray-100 bg-gray-50",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "border-transparent hover:bg-gray-200 active:bg-gray-300",
        link: "underline-offset-4 hover:underline text-primary",
      },
      size: {
        default: "h-9 px-2.5 gap-x-2.5 text-sm",
        sm: "h-7 text-xs px-2 gap-x-1.5 rounded-md",
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
  icon?: React.ComponentType<{ className?: string }>;
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      icon: Icon,
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
        {asChild ? (
          children
        ) : (
          <>
            {loading ? (
              <Loader2Icon className="size-4 animate-spin" />
            ) : Icon ? (
              <Icon className={cn("-ml-0.5 size-4")} />
            ) : null}
            {children}
          </>
        )}
      </Comp>
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
