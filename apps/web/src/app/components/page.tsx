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
    <h2 className={cn("font-semibold leading-9", className)}>{children}</h2>
  );
}

export function PageHeader({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "bg-gray-50 z-20 lg:px-6 lg:py-4 border-b px-4 py-3",
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
  return (
    <div className={cn("lg:px-6 lg:py-5 px-4 py-3", className)}>{children}</div>
  );
}
