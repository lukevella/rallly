import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";
import type * as React from "react";

import { cn } from "./lib/utils";

const alertVariants = cva(
  "group/alert relative grid w-full items-center gap-0.5 rounded-lg border px-2.5 py-2 text-left text-sm has-[>svg]:has-data-[slot=alert-action]:grid-cols-[auto_1fr_auto] has-[>svg]:grid-cols-[auto_1fr] has-data-[slot=alert-action]:grid-cols-[1fr_auto] has-data-[slot=alert-title]:items-start has-[>svg]:gap-x-2 has-data-[slot=alert-action]:gap-x-2 *:[svg:not([class*='size-'])]:size-4 *:[svg]:text-current has-data-[slot=alert-title]:*:[svg]:row-span-2 has-data-[slot=alert-title]:*:[svg]:translate-y-0.5",
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
        "font-medium group-has-[>svg]/alert:col-start-2 [&_a]:underline [&_a]:underline-offset-3 [&_a]:hover:text-foreground",
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
        "text-pretty text-muted-foreground text-sm [&_a]:underline [&_a]:underline-offset-3 [&_a]:hover:text-foreground [&_p:not(:last-child)]:mb-4",
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
        "col-start-2 justify-self-end group-has-[>svg]/alert:col-start-3 group-has-data-[slot=alert-title]/alert:row-span-2 group-has-data-[slot=alert-title]/alert:row-start-1",
        className,
      )}
      {...props}
    />
  );
}

export { Alert, AlertTitle, AlertDescription, AlertAction };
