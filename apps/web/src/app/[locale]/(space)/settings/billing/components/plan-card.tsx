import { cn } from "@rallly/ui";
import { Card } from "@rallly/ui/card";
import type * as React from "react";

export function PlanCard({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <Card className={cn("@container flex flex-col", className)} {...props} />
  );
}

export function PlanCardHeading({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return <div className={cn("space-y-0.5 px-4 pt-4", className)} {...props} />;
}

export function PlanCardHeadingTitle({
  className,
  ...props
}: React.ComponentProps<"h2">) {
  return <h2 className={cn("font-semibold text-sm", className)} {...props} />;
}

export function PlanCardHeadingDescription({
  className,
  ...props
}: React.ComponentProps<"p">) {
  return (
    <p className={cn("text-muted-foreground text-sm", className)} {...props} />
  );
}

export function PlanCardHeader({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "flex @sm:flex-row flex-col @sm:flex-wrap @sm:items-center gap-4 p-4",
        className,
      )}
      {...props}
    />
  );
}

export function PlanCardContent({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    // basis-56 rather than auto so the row wraps once the text is squeezed to
    // that width, instead of letting the actions push past the card edge.
    <div
      className={cn("min-w-0 grow @sm:basis-56 space-y-1", className)}
      {...props}
    />
  );
}

export function PlanCardTitle({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-x-2 gap-y-1 font-semibold text-xl",
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
    <p className={cn("text-muted-foreground text-sm", className)} {...props} />
  );
}

export function PlanCardActions({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("@sm:ml-auto flex flex-wrap items-center gap-2", className)}
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
      className={cn(
        // Inset rule rather than a full width border, so the footer reads as
        // part of the card rather than a separate band. mt-auto pins it to the
        // bottom when paired cards have unequal content heights.
        "mx-4 mt-auto flex @sm:flex-row flex-col @sm:items-center gap-2 border-card-border border-t pt-3 pb-4 text-muted-foreground text-sm @sm:[&>*:last-child]:ml-auto",
        className,
      )}
      {...props}
    />
  );
}
