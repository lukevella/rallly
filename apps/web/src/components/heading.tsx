import { cn } from "@rallly/ui";

import { heading } from "@/fonts/heading";

export function Heading({
  children,
  className,
}: React.PropsWithChildren<{ className?: string }>) {
  return (
    <h1 className={cn("text-2xl font-semibold", heading.className, className)}>
      {children}
    </h1>
  );
}

export function Subheading({
  children,
  className,
}: React.PropsWithChildren<{ className?: string }>) {
  return (
    <h2 className={cn("text-lg font-semibold", heading.className, className)}>
      {children}
    </h2>
  );
}
