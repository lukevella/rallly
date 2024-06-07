"use client";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "./lib/utils";
import { VariantProps, cva } from "class-variance-authority";

const iconVariants = cva("", {
  variants: {
    variant: {
      default: "text-gray-500",
      success: "text-green-500",
      danger: "text-rose-500",
      primary: "text-primary-600",
    },
    size: {
      sm: "w-3 h-3",
      md: "w-4 h-4",
      lg: "w-5 h-5",
      xl: "w-7 h-7",
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

export function Icon({ children, size, variant }: IconProps) {
  return (
    <Slot
      className={cn(
        iconVariants({ size, variant }),
        "group-[.bg-primary]:text-primary-50 group-[.bg-destructive]:text-destructive-foreground group shrink-0",
      )}
    >
      {children}
    </Slot>
  );
}
