import { Slot } from "@radix-ui/react-slot";
import { SpinnerIcon } from "@rallly/icons";
import { cva, VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/lib/utils";
import { IconComponent } from "@/types";

const buttonVariants = cva(
  "inline-flex select-none items-center justify-center gap-x-1.5 whitespace-nowrap text-sm rounded-md border font-medium",
  {
    variants: {
      variant: {
        primary:
          "border-gray-900 bg-gray-800 text-white shadow-sm ring-1 ring-inset ring-white/10 hover:bg-gray-700 active:bg-gray-900",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        default:
          "bg-white/50 text-gray-700 hover:bg-gray-50 hover:shadow-sm active:bg-gray-200 active:shadow-none",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "underline-offset-4 hover:underline text-primary",
      },
      size: {
        default: "h-9 px-2.5",
        sm: "h-9 px-3 rounded-md",
        lg: "h-11 px-8 rounded-md",
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
  icon?: IconComponent;
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
      size,
      asChild = false,
      ...props
    },
    ref,
  ) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      >
        {loading ? (
          <SpinnerIcon className="h-4 w-4 animate-spin" />
        ) : Icon ? (
          <Icon className="h-4 w-4" />
        ) : null}
        {children}
      </Comp>
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
