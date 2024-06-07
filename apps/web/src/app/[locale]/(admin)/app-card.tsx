import { cn } from "@rallly/ui";
import React from "react";

import { Squircle } from "@/app/components/squircle";

export function AppCard({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex w-full flex-col justify-between rounded-xl border bg-gray-50 p-4 shadow-sm ring-1 ring-inset ring-white/75 sm:w-80",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function AppCardContent({ children }: { children?: React.ReactNode }) {
  return (
    <div className="mt-2 flex flex-col items-center text-center">
      {children}
    </div>
  );
}
export function AppCardIcon({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className="relative mb-2 inline-flex size-12 items-center justify-center">
      <Squircle
        className={cn(
          "inline-flex size-10 items-center justify-center bg-purple-600 text-purple-100",
          className,
        )}
      >
        {children}
      </Squircle>
    </div>
  );
}

export function AppCardName({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <h2 className={cn("text-center text-lg font-semibold", className)}>
      {children}
    </h2>
  );
}

export function AppCardDescription({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <p
      className={cn(
        "text-muted-foreground mx-auto mt-2 max-w-80 px-2.5 text-center text-sm",
        className,
      )}
    >
      {children}
    </p>
  );
}

export function AppCardFooter({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("mt-8 grid gap-2.5", className)}>{children}</div>;
}
