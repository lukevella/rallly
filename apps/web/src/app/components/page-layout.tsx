"use client";
import { cn } from "@rallly/ui";

export function PageContainer({
  children,
  className,
}: React.PropsWithChildren<{ className?: string }>) {
  return (
    <div className={cn("lg:flex lg:h-screen lg:flex-col lg:pr-4", className)}>
      {children}
    </div>
  );
}

export function PageTitle({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <h2
      className={cn(
        "flex items-center gap-x-2.5 truncate text-lg font-semibold leading-9",
        className,
      )}
    >
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
  return <div className={cn("bg-gray-100 p-4", className)}>{children}</div>;
}

export function PageContent({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("p-4 lg:grow", className)}>{children}</div>;
}
