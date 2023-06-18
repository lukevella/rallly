import { type VariantProps, cva } from "class-variance-authority";
import * as React from "react";

import { cn } from "./lib/utils";

const alertVariants = cva(
  "flex flex-col shadow-sm sm:flex-row gap-x-3 gap-y-2 rounded-md border p-3",
  {
    variants: {
      variant: {
        default: "bg-gray-50 text-foreground",
        destructive:
          "text-destructive border-destructive/50 dark:border-destructive [&>svg]:text-destructive text-destructive",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> &
    VariantProps<typeof alertVariants> & {
      icon: React.ComponentType<{ className?: string }>;
    }
>(({ className, icon: Icon, children, variant, ...props }, ref) => (
  <div
    ref={ref}
    role="alert"
    className={cn(alertVariants({ variant }), className)}
    {...props}
  >
    {Icon ? <Icon className="mt-0.5 h-4 w-4" /> : null}
    <div>{children}</div>
  </div>
));
Alert.displayName = "Alert";

Alert.displayName = "Alert";
const AlertTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn("mb-1 font-medium leading-none tracking-tight", className)}
    {...props}
  />
));
AlertTitle.displayName = "AlertTitle";

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm [&_p]:leading-relaxed", className)}
    {...props}
  />
));
AlertDescription.displayName = "AlertDescription";

export { Alert, AlertDescription, AlertTitle };
