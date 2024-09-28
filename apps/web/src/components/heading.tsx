import { cn } from "@rallly/ui";

import { heading } from "@/fonts/heading";

export function Heading({
  children,
  className,
}: React.PropsWithChildren<{ className?: string }>) {
  return (
    <h1
      className={cn(
        "text-xl font-semibold text-gray-900",
        heading.className,
        className,
      )}
    >
      {children}
    </h1>
  );
}

export function Subheading({
  children,
  className,
}: React.PropsWithChildren<{ className?: string }>) {
  return (
    <h2 className={cn("text-base font-semibold", className)}>{children}</h2>
  );
}
