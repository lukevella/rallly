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
    <h2 className={cn("truncate font-semibold leading-9", className)}>
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
        "px-4 py-3 lg:px-6 lg:py-3",
        {
          "sticky top-0 z-20 border-b bg-gray-50": variant === "default",
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
  return <div className={cn("p-4 lg:px-6 lg:py-5", className)}>{children}</div>;
}
