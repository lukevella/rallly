import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";
import type * as React from "react";

import { cn } from "./lib/utils";

const alertVariants = cva(
  "group/alert relative grid w-full items-center gap-y-2 rounded-lg border px-2.5 py-2 text-left text-sm has-data-[slot=alert-title]:items-start has-data-[slot=alert-action]:gap-x-2 sm:has-[>svg]:has-data-[slot=alert-action]:grid-cols-[auto_1fr_auto] sm:gap-0.5 sm:has-[>svg]:grid-cols-[auto_1fr] sm:has-data-[slot=alert-action]:grid-cols-[1fr_auto] sm:has-[>svg]:gap-x-2 *:[svg:not([class*='size-'])]:size-4 not-has-data-[slot=alert-action]:*:[svg]:self-start *:[svg]:text-current sm:not-has-data-[slot=alert-action]:*:[svg]:translate-y-0.5 sm:has-data-[slot=alert-title]:*:[svg]:row-span-2 sm:has-data-[slot=alert-title]:*:[svg]:translate-y-0.5",
  {
    variants: {
      variant: {
        primary:
          "border-indigo-500/20 bg-indigo-500/10 text-indigo-900 *:data-[slot=alert-description]:text-indigo-900/90 dark:text-indigo-100 dark:*:data-[slot=alert-description]:text-indigo-100/90 [&>svg]:text-indigo-900/75 dark:[&>svg]:text-indigo-100/75",
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
      className={cn(
        "font-medium sm:group-has-[>svg]/alert:col-start-2 [&_a]:underline [&_a]:underline-offset-3 [&_a]:hover:text-foreground",
        className,
      )}
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
        "col-start-1 text-balance text-muted-foreground text-sm sm:group-has-[>svg]/alert:col-start-2 md:text-pretty [&_a]:underline [&_a]:underline-offset-3 [&_a]:hover:text-foreground [&_p:not(:last-child)]:mb-4",
        className,
      )}
      {...props}
    />
  );
}

function AlertAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-action"
      className={cn(
        "col-start-1 justify-self-start sm:col-start-2 sm:justify-self-end sm:group-has-[>svg]/alert:col-start-3 sm:group-has-data-[slot=alert-title]/alert:row-span-2 sm:group-has-data-[slot=alert-title]/alert:row-start-1",
        className,
      )}
      {...props}
    />
  );
}

export { Alert, AlertTitle, AlertDescription, AlertAction };
