import { type VariantProps, cva } from "class-variance-authority";
import * as React from "react";

import { cn } from "./lib/utils";

const badgeVariants = cva(
  "inline-flex group whitespace-nowrap items-center rounded-full justify-center font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        primary: "bg-primary text-primary-50",
        default: "bg-gray-50 text-secondary-foreground",
        destructive: "bg-destructive text-destructive-foreground",
        outline: "text-foreground",
        green: "bg-green-600 text-white",
        secondary: "text-primary bg-primary-50",
      },
      size: {
        md: "h-6 min-w-5 text-xs px-2",
        lg: "h-7 text-sm min-w-7 px-2.5",
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
