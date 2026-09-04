import { cn } from "@rallly/ui";
import { CircleCheckIcon, XIcon } from "lucide-react";
import type * as React from "react";

export function CompareTable({
  className,
  ...props
}: React.ComponentProps<"table">) {
  return (
    <div className="overflow-x-auto">
      <table
        className={cn("w-full border-collapse text-sm", className)}
        {...props}
      />
    </div>
  );
}

export function CompareTableHead({
  className,
  ...props
}: React.ComponentProps<"th">) {
  return (
    <th
      className={cn(
        "w-1/5 px-4 py-4 text-left font-medium text-gray-800",
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
      className={cn("py-4 pr-4 text-left font-normal text-gray-600", className)}
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
      className={cn("block font-medium text-gray-800", className)}
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
