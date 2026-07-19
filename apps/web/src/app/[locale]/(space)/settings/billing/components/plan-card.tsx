import { cn } from "@rallly/ui";
import { Card } from "@rallly/ui/card";
import type * as React from "react";

export function PlanCard({ className, ...props }: React.ComponentProps<"div">) {
  return <Card className={cn("@container", className)} {...props} />;
}

export function PlanCardHeader({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "flex @sm:flex-row flex-col items-start @sm:items-center gap-3 p-3",
        className,
      )}
      {...props}
    />
  );
}

export function PlanCardFooter({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("border-card-border border-t p-3", className)}
      {...props}
    />
  );
}

export function PlanCardIcon({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return <div className={cn("shrink-0", className)} {...props} />;
}

export function PlanCardContent({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return <div className={cn("min-w-0 flex-1", className)} {...props} />;
}

export function PlanCardTitle({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "flex items-center gap-x-2 font-semibold text-sm",
        className,
      )}
      {...props}
    />
  );
}

export function PlanCardDescription({
  className,
  ...props
}: React.ComponentProps<"p">) {
  return (
    <p
      className={cn("truncate text-muted-foreground text-sm", className)}
      {...props}
    />
  );
}

export function PlanCardPrice({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("@sm:mr-2 shrink-0 @sm:text-right", className)}
      {...props}
    />
  );
}

export function PlanCardPriceValue({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("font-semibold text-sm tabular-nums", className)}
      {...props}
    />
  );
}

export function PlanCardPriceDescription({
  className,
  ...props
}: React.ComponentProps<"p">) {
  return (
    <p className={cn("text-muted-foreground text-sm", className)} {...props} />
  );
}
