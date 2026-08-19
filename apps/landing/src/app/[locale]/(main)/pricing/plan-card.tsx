import { cn } from "@rallly/ui";
import { Tooltip, TooltipContent, TooltipTrigger } from "@rallly/ui/tooltip";
import type * as React from "react";

export function PlanCards({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "grid divide-y divide-gray-950/5 overflow-hidden rounded-2xl border bg-white md:grid-cols-5 md:divide-x md:divide-y-0",
        className,
      )}
      {...props}
    />
  );
}

export function PlanCard({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div className={cn("flex flex-col gap-6 p-6", className)} {...props} />
  );
}

export function PlanCardHeader({
  className,
  ...props
}: React.ComponentProps<"header">) {
  return <header className={cn("space-y-0.5", className)} {...props} />;
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
      className={cn(
        "flex min-h-14 flex-wrap items-center gap-x-1.5",
        className,
      )}
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
        "font-semibold text-4xl text-gray-800 tabular-nums tracking-tight",
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
  return <ul className={cn("grid gap-3", className)} {...props} />;
}

export function PlanBenefit({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <li className="flex items-center gap-x-3 [&_svg]:size-4 [&_svg]:h-lh [&_svg]:shrink-0 [&_svg]:text-gray-400">
      {icon}
      {children}
    </li>
  );
}

export function PlanBenefitName({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      className={cn("font-medium text-gray-800 text-sm", className)}
      {...props}
    />
  );
}

export function PlanBenefitTooltip({
  content,
  children,
}: {
  content: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger className="cursor-help text-left font-medium text-gray-800 text-sm underline decoration-gray-400 decoration-dotted underline-offset-4">
        {children}
      </TooltipTrigger>
      <TooltipContent className="max-w-64">{content}</TooltipContent>
    </Tooltip>
  );
}
