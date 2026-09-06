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
        "max-w-prose text-pretty text-base/6 text-gray-500 sm:text-lg",
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

/**
 * Two-column section for large screens: the heading sits in a sticky left
 * column while the content scrolls on the right. Stacks below `lg`.
 * The sticky offset matches the site header (`top-24`).
 */
export function SectionSplit({
  className,
  ...props
}: React.ComponentProps<"section">) {
  return (
    <Section
      className={cn(
        "lg:grid lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:items-start lg:gap-x-16",
        "[&>header]:lg:sticky [&>header]:lg:top-24",
        "[&>header+div]:lg:mt-0",
        className,
      )}
      {...props}
    />
  );
}
