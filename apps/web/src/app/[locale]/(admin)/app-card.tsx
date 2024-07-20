import { cn } from "@rallly/ui";
import { BarChart2Icon } from "lucide-react";
import React from "react";

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
        "flex w-full flex-col justify-between rounded-lg border bg-white p-4 shadow-sm ring-1 ring-inset ring-white/50",
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

export function GroupPollIcon({
  size = "md",
}: {
  size?: "xs" | "sm" | "md" | "lg";
}) {
  return (
    <div
      role="img"
      aria-label="Group Poll Icon"
      className={cn(
        "inline-flex items-center justify-center bg-gradient-to-br from-purple-500 to-violet-500 text-purple-100",
        {
          "size-6 rounded": size === "xs",
          "size-8 rounded-md": size === "sm",
          "size-9 rounded-md": size === "md",
          "size-10 rounded-lg": size === "lg",
        },
      )}
    >
      <BarChart2Icon
        className={cn({
          "size-4": size === "sm" || size === "xs",
          "size-5": size === "md",
          "size-6": size === "lg",
        })}
      />
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
  return <h2 className={cn("font-semibold", className)}>{children}</h2>;
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
        "text-muted-foreground mt-1 text-sm leading-relaxed",
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
  return <div className={cn("mt-6 border-t pt-3", className)}>{children}</div>;
}
