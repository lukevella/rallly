import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";
import type * as React from "react";

import { cn } from "./lib/utils";

const alertVariants = cva(
  "relative grid w-full grid-cols-[0_1fr] items-start gap-y-0.5 rounded-xl border px-4 py-3 text-sm has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr] has-[>svg]:gap-x-3 [&>svg]:size-4 [&>svg]:translate-y-0.5 [&>svg]:text-current",
  {
    variants: {
      variant: {
        primary:
          "border-transparent bg-primary *:data-[slot=alert-description]:text-primary-foreground/90 [&>svg]:text-primary-foreground",
        info: "border-blue-500/20 bg-blue-500/10 text-blue-900 *:data-[slot=alert-description]:text-blue-900/90 dark:text-blue-100 dark:*:data-[slot=alert-description]:text-blue-100/90 [&>svg]:text-blue-900/75 dark:[&>svg]:text-blue-100/75",
        warning:
          "border-yellow-500/20 bg-yellow-500/10 text-yellow-900 *:data-[slot=alert-description]:text-yellow-900/90 dark:text-yellow-100 dark:*:data-[slot=alert-description]:text-yellow-100/90 [&>svg]:text-yellow-900/75 dark:[&>svg]:text-yellow-100/75",
        success:
          "border-green-500/20 bg-green-500/10 text-green-900 *:data-[slot=alert-description]:text-green-900/90 dark:text-green-100 dark:*:data-[slot=alert-description]:text-green-100/90 [&>svg]:text-green-900/75 dark:[&>svg]:text-green-100/75",
        note: "border-muted-border bg-muted *:data-[slot=alert-description]:text-muted-foreground/75 [&>svg]:text-muted-foreground/90",
        error:
          "border-rose-500/20 bg-rose-500/10 text-rose-900 *:data-[slot=alert-description]:text-rose-900/90 dark:text-rose-100 dark:*:data-[slot=alert-description]:text-rose-100/90 [&>svg]:text-rose-900/75 dark:[&>svg]:text-rose-100/75",
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
