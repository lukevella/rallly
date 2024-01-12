"use client";
import { cn } from "@rallly/ui";

export function PageContainer({
  children,
  className,
}: React.PropsWithChildren<{ className?: string }>) {
  return <div className={cn("", className)}>{children}</div>;
}

export function PageTitle({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <h2 className={cn("font-semibold leading-9 truncate", className)}>
      {children}
    </h2>
  );
}

export function PageHeader({
  children,
  className,
  variant = "default",
}: {
  children?: React.ReactNode;
  className?: string;
  variant?: "default" | "ghost";
}) {
  return (
    <div
      className={cn(
        "lg:px-6 lg:py-3 px-4 py-3",
        {
          "border-b bg-gray-50 sticky z-20 top-0": variant === "default",
        },
        className,
      )}
    >
      {children}
    </div>
  );
}

export function PageContent({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("lg:p-6 p-4", className)}>{children}</div>;
}
