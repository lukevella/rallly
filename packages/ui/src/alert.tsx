import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";
import type * as React from "react";

import { cn } from "./lib/utils";

const alertVariants = cva(
  "relative grid w-full grid-cols-[0_1fr] items-start gap-y-0.5 rounded-lg px-4 py-3 text-sm has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr] has-[>svg]:gap-x-3 [&>svg]:size-4 [&>svg]:translate-y-0.5 [&>svg]:text-current",
  {
    variants: {
      variant: {
        default: "bg-card text-card-foreground",
        primary:
          "bg-primary *:data-[slot=alert-description]:text-primary-foreground/90 [&>svg]:text-primary-foreground",
        info: "bg-info text-info-foreground *:data-[slot=alert-description]:text-info-foreground/90 [&>svg]:text-info-foreground/90",
        warning:
          "bg-warning text-warning-foreground *:data-[slot=alert-description]:text-warning-foreground/90 [&>svg]:text-warning-foreground/90",
        success:
          "bg-success text-success-foreground *:data-[slot=alert-description]:text-success-foreground/90 [&>svg]:text-success-foreground/90",
        note: "bg-muted text-muted-foreground *:data-[slot=alert-description]:text-muted-foreground/75 [&>svg]:text-muted-foreground/90",
      },
    },
    defaultVariants: {
      variant: "note",
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
