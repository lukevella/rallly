import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";
import type * as React from "react";

import { cn } from "./lib/utils";

const alertVariants = cva(
  "relative grid w-full grid-cols-[0_1fr] items-start gap-y-0.5 rounded-lg border px-4 py-3 text-sm has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr] has-[>svg]:gap-x-3 [&>svg]:size-4 [&>svg]:translate-y-0.5 [&>svg]:text-current",
  {
    variants: {
      variant: {
        default: "bg-card text-card-foreground",
        primary:
          "border-primary-200 bg-primary-50 has-[[data-slot=alert-description]]:text-primary-700/90 [&>svg]:text-primary-600",
        destructive:
          "border-destructive/20 bg-destructive-background text-destructive-foreground has-[[data-slot=alert-description]]:opacity-50",
        info: "border-blue-200 bg-blue-50 text-blue-900 has-[[data-slot=alert-description]]:text-blue-800/90 [&>svg]:text-blue-600",
        warning:
          "border-yellow-200 bg-yellow-50 text-yellow-900 has-[[data-slot=alert-description]]:text-yellow-800/90 [&>svg]:text-yellow-600",
        tip: "border-green-200 bg-green-50 text-green-900 has-[[data-slot=alert-description]]:text-green-800/90 [&>svg]:text-green-600",
        note: "border-gray-200 bg-gray-50 text-gray-900 has-[[data-slot=alert-description]]:text-gray-700/90 [&>svg]:text-gray-600",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function Alert({
  className,
  variant,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof alertVariants>) {
  return (
    <div
      data-slot="alert"
      role="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    />
  );
}

function AlertTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-title"
      className={cn("col-start-2 line-clamp-1 min-h-4 font-medium", className)}
      {...props}
    />
  );
}

function AlertDescription({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-description"
      className={cn(
        "col-start-2 grid justify-items-start gap-1 text-sm [&_p]:leading-5",
        className,
      )}
      {...props}
    />
  );
}

export { Alert, AlertTitle, AlertDescription };
