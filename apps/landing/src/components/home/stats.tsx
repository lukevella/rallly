import { cn } from "@rallly/ui";
import type * as React from "react";

export function Stats({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <p
      className={cn(
        "mx-auto max-w-2xl text-balance text-center text-base text-gray-600 leading-loose sm:text-xl",
        className,
      )}
    >
      {children}
    </p>
  );
}
