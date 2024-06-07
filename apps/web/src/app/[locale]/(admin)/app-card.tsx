import { cn } from "@rallly/ui";
import { BarChart2Icon } from "lucide-react";
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
    <div className="flex flex-col items-center pt-2.5 text-center">
      {children}
    </div>
  );
}

export function GroupPollIcon() {
  return (
    <Squircle className="bg-purple-200 p-px">
      <Squircle className="bg-purple-50 p-1">
        <Squircle
          className={cn(
            "inline-flex size-10 items-center justify-center bg-purple-600 text-purple-100",
          )}
        >
          <BarChart2Icon className="size-6" />
        </Squircle>
      </Squircle>
    </Squircle>
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
    <div className="relative mb-4 inline-flex size-12 items-center justify-center">
      <Squircle className="bg-purple-200 p-px">
        <Squircle className="bg-purple-50 p-1">
          <Squircle
            className={cn(
              "inline-flex size-10 items-center justify-center bg-purple-600 text-purple-100",
              className,
            )}
          >
            {children}
          </Squircle>
        </Squircle>
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
  return <h2 className={cn("text-lg font-semibold", className)}>{children}</h2>;
}

export function AppCardDescription({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <p className={cn("text-muted-foreground mt-2 text-sm", className)}>
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
