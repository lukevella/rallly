import { type VariantProps, cva } from "class-variance-authority";
import type * as React from "react";

import { cn } from "./lib/utils";

const badgeVariants = cva(
  "group inline-flex items-center justify-center whitespace-nowrap rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        primary: "bg-primary text-primary-50",
        default: "border bg-gray-50",
        destructive: "bg-destructive text-destructive-foreground",
        outline: "text-foreground",
        green: "bg-green-600 text-white",
        secondary: "border border-primary-200 bg-primary-50 text-primary",
      },
      size: {
        sm: "h-5 min-w-5 px-1.5 text-xs",
        md: "h-6 min-w-5 px-2 text-xs",
        lg: "h-7 min-w-7 px-2.5 text-sm",
      },
    },
    defaultVariants: {
      size: "md",
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, size, ...props }: BadgeProps) {
  return (
    <div
      className={cn(badgeVariants({ variant, size }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
