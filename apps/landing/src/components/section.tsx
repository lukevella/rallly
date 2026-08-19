import { cn } from "@rallly/ui";
import type * as React from "react";

export function Section({
  className,
  ...props
}: React.ComponentProps<"section">) {
  return <section className={cn("py-8 sm:py-16", className)} {...props} />;
}

export function SectionHeading({
  className,
  ...props
}: React.ComponentProps<"header">) {
  return <header className={cn("space-y-3", className)} {...props} />;
}

export function SectionTitle({
  className,
  ...props
}: React.ComponentProps<"h2">) {
  return (
    <h2
      className={cn(
        "text-balance font-medium text-2xl text-gray-800 leading-tight tracking-tight sm:text-4xl",
        className,
      )}
      {...props}
    />
  );
}

export function SectionDescription({
  className,
  ...props
}: React.ComponentProps<"p">) {
  return (
    <p
      className={cn(
        "max-w-prose text-pretty text-gray-500 text-sm sm:text-lg",
        className,
      )}
      {...props}
    />
  );
}

export function SectionContent({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return <div className={cn("mt-8 sm:mt-12", className)} {...props} />;
}
