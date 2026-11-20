import { cn } from "@rallly/ui";
import { CircleCheckIcon, XIcon } from "lucide-react";
import type * as React from "react";

export function CompareTable({
  className,
  ...props
}: React.ComponentProps<"table">) {
  return (
    <table
      className={cn("w-full border-collapse text-sm", className)}
      {...props}
    />
  );
}

export function CompareTableHeader({
  className,
  ...props
}: React.ComponentProps<"thead">) {
  return (
    <thead
      className={cn(
        "sticky top-(--site-header-height,0px) z-10 bg-page [&_th]:shadow-[inset_0_-1px_0_var(--color-border)]",
        className,
      )}
      {...props}
    />
  );
}

export function CompareTableHead({
  className,
  ...props
}: React.ComponentProps<"th">) {
  return (
    <th
      className={cn(
        "w-1/5 px-4 py-4 text-left font-medium text-base text-foreground",
        className,
      )}
      {...props}
    />
  );
}

export function CompareTableFeature({
  className,
  ...props
}: React.ComponentProps<"th">) {
  return (
    <th
      scope="row"
      className={cn(
        "py-4 pr-4 text-left font-normal text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}

export function CompareTableCell({
  className,
  ...props
}: React.ComponentProps<"td">) {
  return (
    <td
      className={cn(
        "px-4 py-4 text-foreground sm:whitespace-nowrap",
        className,
      )}
      {...props}
    />
  );
}

export function CompareTableFeatureName({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      className={cn("block font-normal text-foreground", className)}
      {...props}
    />
  );
}

export function CompareTableFeatureDescription({
  className,
  ...props
}: React.ComponentProps<"p">) {
  return (
    <p
      className={cn(
        "mt-0.5 text-gray-500 text-xs dark:text-gray-400",
        className,
      )}
      {...props}
    />
  );
}

export function CompareTableSection({
  className,
  icon,
  children,
  ...props
}: React.ComponentProps<"th"> & { icon?: React.ReactNode }) {
  return (
    <tr>
      <th
        scope="colgroup"
        colSpan={3}
        className={cn(
          "pt-8 pb-3 text-left font-medium text-base text-foreground",
          className,
        )}
        {...props}
      >
        <span className="flex items-center gap-x-2 [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-gray-400 dark:[&_svg]:text-gray-500">
          {icon}
          {children}
        </span>
      </th>
    </tr>
  );
}

export function CompareTableCheck({ label }: { label: string }) {
  return (
    <>
      <CircleCheckIcon
        className="size-4 text-green-600 dark:text-green-500"
        aria-hidden="true"
      />
      <span className="sr-only">{label}</span>
    </>
  );
}

export function CompareTableDash({ label }: { label: string }) {
  return (
    <>
      <XIcon
        className="size-4 text-gray-400 dark:text-gray-500"
        aria-hidden="true"
      />
      <span className="sr-only">{label}</span>
    </>
  );
}
