import { cn } from "@rallly/ui";
import { MinusIcon } from "lucide-react";
import type * as React from "react";

export function PlanCards({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "grid w-full max-w-3xl gap-4 md:grid-cols-2 md:gap-6",
        className,
      )}
      {...props}
    />
  );
}

export function PlanCard({
  className,
  featured,
  ...props
}: React.ComponentProps<"div"> & { featured?: boolean }) {
  const card = (
    <div
      className={cn(
        "flex h-full flex-col gap-6 rounded-2xl bg-white p-6",
        !featured && "border",
        featured && "rounded-[calc(var(--radius-2xl)-1px)]",
        className,
      )}
      {...props}
    />
  );

  if (!featured) {
    return card;
  }

  return (
    <div className="plan-card-featured relative rounded-2xl p-px shadow-indigo-500/10 shadow-lg">
      {card}
    </div>
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
        "flex min-h-14 flex-wrap items-baseline gap-x-1.5",
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
        "font-medium text-4xl text-gray-800 tabular-nums tracking-tight",
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

export function PlanBenefitUnavailable({
  srLabel,
  children,
}: {
  srLabel: string;
  children: React.ReactNode;
}) {
  return (
    <li className="flex items-center gap-x-3">
      <MinusIcon className="size-4 h-lh shrink-0 text-gray-300" />
      <span className="text-gray-400 text-sm">
        {children}
        <span className="sr-only"> ({srLabel})</span>
      </span>
    </li>
  );
}

export function PlanBenefitName({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return <span className={cn("text-gray-800 text-sm", className)} {...props} />;
}
