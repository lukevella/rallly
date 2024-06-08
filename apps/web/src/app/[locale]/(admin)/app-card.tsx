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
        "flex w-full flex-col justify-between rounded-xl border bg-white p-4 shadow-sm ring-1 ring-inset ring-white/75 sm:w-80",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function AppCardContent({ children }: { children?: React.ReactNode }) {
  return <div className="">{children}</div>;
}

export function GroupPollIcon({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  return (
    <Squircle className="bg-purple-600 p-px">
      <Squircle className="bg-purple-500 p-px">
        <Squircle
          className={cn(
            "inline-flex items-center justify-center bg-purple-600 text-purple-50",
            {
              "size-8": size === "sm",
              "size-9": size === "md",
              "size-10": size === "lg",
            },
          )}
        >
          <BarChart2Icon
            className={cn({
              "size-4": size === "sm",
              "size-5": size === "md",
              "size-6": size === "lg",
            })}
          />
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
    <div
      className={cn(
        "relative mb-4 inline-flex size-12 items-center justify-center",
        className,
      )}
    >
      {children}
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
    <p className={cn("text-muted-foreground mt-1 text-sm", className)}>
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
  return (
    <div className={cn("mt-6 grid gap-2.5 border-t pt-4", className)}>
      {children}
    </div>
  );
}
