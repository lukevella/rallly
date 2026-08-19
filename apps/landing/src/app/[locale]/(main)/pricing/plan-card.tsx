import { cn } from "@rallly/ui";
import type * as React from "react";

export function PlanCard({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "flex flex-col gap-6 rounded-xl border bg-white p-6",
        className,
      )}
      {...props}
    />
  );
}

export function PlanCardHeader({
  className,
  ...props
}: React.ComponentProps<"header">) {
  return <header className={cn("space-y-1", className)} {...props} />;
}

export function PlanCardName({
  className,
  ...props
}: React.ComponentProps<"h3">) {
  return (
    <h3
      className={cn("font-medium text-gray-800 text-lg", className)}
      {...props}
    />
  );
}

export function PlanCardDescription({
  className,
  ...props
}: React.ComponentProps<"p">) {
  return <p className={cn("text-gray-500 text-sm", className)} {...props} />;
}

export function PlanCardPrice({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("flex flex-wrap items-baseline gap-x-1.5", className)}
      {...props}
    />
  );
}

export function PlanCardPriceAmount({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      className={cn(
        "font-semibold text-4xl text-gray-800 tracking-tight",
        className,
      )}
      {...props}
    />
  );
}

export function PlanCardPriceLabel({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return <span className={cn("text-gray-500 text-sm", className)} {...props} />;
}

export function PlanBenefits({
  className,
  ...props
}: React.ComponentProps<"ul">) {
  return <ul className={cn("grid gap-4", className)} {...props} />;
}

export function PlanBenefit({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: React.ReactNode;
  description: React.ReactNode;
}) {
  return (
    <li className="flex gap-x-3">
      <div className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg border bg-gray-50 text-gray-500 [&_svg]:size-4">
        {icon}
      </div>
      <div>
        <div className="font-medium text-gray-800 text-sm">{title}</div>
        <p className="mt-0.5 text-gray-500 text-sm">{description}</p>
      </div>
    </li>
  );
}
