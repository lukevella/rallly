import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";
import type * as React from "react";

import { cn } from "./lib/utils";

const alertVariants = cva(
  "relative grid w-full grid-cols-[0_1fr] items-start gap-y-0.5 rounded-lg px-4 py-3 text-sm has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr] has-[>svg]:gap-x-3 [&>svg]:size-4 [&>svg]:translate-y-0.5 [&>svg]:text-current",
  {
    variants: {
      variant: {
        primary:
          "bg-primary *:data-[slot=alert-description]:text-primary-foreground/90 [&>svg]:text-primary-foreground",
        info: "bg-blue-50 text-blue-500 *:data-[slot=alert-description]:text-blue-700/90 dark:bg-blue-950 dark:text-blue-100 dark:*:data-[slot=alert-description]:text-blue-100/90 [&>svg]:text-blue-700/90 dark:[&>svg]:text-blue-100/90",
        warning:
          "bg-yellow-50 text-yellow-500 *:data-[slot=alert-description]:text-yellow-500/90 dark:bg-yellow-950 dark:text-yellow-100 dark:*:data-[slot=alert-description]:text-yellow-100/90 [&>svg]:text-yellow-700/90 dark:[&>svg]:text-yellow-100/90",
        success:
          "bg-green-50 text-green-500 *:data-[slot=alert-description]:text-green-500/90 dark:bg-green-950 dark:text-green-100 dark:*:data-[slot=alert-description]:text-green-100/90 [&>svg]:text-green-700/90 dark:[&>svg]:text-green-100/90",
        note: "bg-muted text-muted-foreground *:data-[slot=alert-description]:text-muted-foreground/75 [&>svg]:text-muted-foreground/90",
        error:
          "bg-rose-50 text-rose-500 *:data-[slot=alert-description]:text-rose-500/90 dark:bg-rose-950 dark:text-rose-100 dark:*:data-[slot=alert-description]:text-rose-100/90 [&>svg]:text-rose-700/90 dark:[&>svg]:text-rose-100/90",
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
