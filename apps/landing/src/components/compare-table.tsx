import { cn } from "@rallly/ui";
import { CircleCheckIcon, XIcon } from "lucide-react";
import type * as React from "react";

export function CompareTable({
  className,
  ...props
}: React.ComponentProps<"table">) {
  return (
    <div className="overflow-x-clip">
      <table
        className={cn("w-full border-collapse text-sm", className)}
        {...props}
      />
    </div>
  );
}

export function CompareTableHeader({
  className,
  ...props
}: React.ComponentProps<"thead">) {
  return (
    <thead
      className={cn(
        "sticky top-(--site-header-height,0px) z-10 bg-gray-100 [&_th]:shadow-[inset_0_-1px_0_var(--color-border)]",
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
        "w-1/5 px-4 py-4 text-left font-medium text-base text-gray-800",
        className,
      )}
      {...props}
    />
  );
}

export function CompareTableFeature({
  className,
  icon,
  children,
  ...props
}: React.ComponentProps<"th"> & { icon?: React.ReactNode }) {
  return (
    <th
      scope="row"
      className={cn("py-4 pr-4 text-left font-normal text-gray-600", className)}
      {...props}
    >
      {icon ? (
        <div className="flex gap-x-3">
          <span className="flex h-lh shrink-0 items-center [&_svg]:size-4 [&_svg]:text-gray-400">
            {icon}
          </span>
          <div>{children}</div>
        </div>
      ) : (
        children
      )}
    </th>
  );
}

export function CompareTableCell({
  className,
  ...props
}: React.ComponentProps<"td">) {
  return (
    <td
      className={cn("whitespace-nowrap px-4 py-4 text-gray-800", className)}
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
      className={cn("block font-normal text-gray-800", className)}
      {...props}
    />
  );
}

export function CompareTableFeatureDescription({
  className,
  ...props
}: React.ComponentProps<"p">) {
  return (
    <p className={cn("mt-0.5 text-gray-500 text-xs", className)} {...props} />
  );
}

export function CompareTableSection({
  className,
  ...props
}: React.ComponentProps<"th">) {
  return (
    <tr>
      <th
        scope="colgroup"
        colSpan={3}
        className={cn(
          "pt-8 pb-3 text-left font-medium text-base text-gray-800",
          className,
        )}
        {...props}
      />
    </tr>
  );
}

export function CompareTableCheck({ label }: { label: string }) {
  return (
    <>
      <CircleCheckIcon className="size-4 text-green-600" aria-hidden="true" />
      <span className="sr-only">{label}</span>
    </>
  );
}

export function CompareTableDash({ label }: { label: string }) {
  return (
    <>
      <XIcon className="size-4 text-gray-400" aria-hidden="true" />
      <span className="sr-only">{label}</span>
    </>
  );
}
