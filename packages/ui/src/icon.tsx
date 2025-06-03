"use client";
import { Slot } from "@radix-ui/react-slot";
import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";

import { cn } from "./lib/utils";

const iconVariants = cva("", {
  variants: {
    variant: {
      default: "text-gray-500",
      success: "text-green-500",
      danger: "text-rose-500",
      primary: "text-primary-600",
    },
    size: {
      sm: "h-3 w-3",
      md: "h-4 w-4",
      lg: "h-5 w-5",
      xl: "h-7 w-7",
    },
  },
  defaultVariants: {
    size: "md",
    variant: "default",
  },
});

export interface IconProps extends VariantProps<typeof iconVariants> {
  children?: React.ReactNode;
}

export function Icon({
  children,
  className,
  size,
  variant,
}: { className?: string } & IconProps) {
  return (
    <Slot
      className={cn(
        iconVariants({ size, variant }),
        "group shrink-0 group-[.bg-destructive]:text-destructive-foreground group-[.bg-primary]:text-primary-50",
        className,
      )}
    >
      {children}
    </Slot>
  );
}
