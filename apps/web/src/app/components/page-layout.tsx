"use client";
import { cn } from "@rallly/ui";
import { Icon } from "@rallly/ui/icon";

export function PageContainer({
  children,
  className,
}: React.PropsWithChildren<{ className?: string }>) {
  return (
    <div
      className={cn(
        "h-full max-w-4xl grow px-3 py-4 lg:px-4 lg:py-6",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function PageIcon({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn(className)}>
      <Icon size="lg">{children}</Icon>
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
    <h2 className={cn("truncate text-base font-semibold", className)}>
      {children}
    </h2>
  );
}

export function PageHeader({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
  variant?: "default" | "ghost";
}) {
  return <div className={cn("mb-4 lg:mb-6", className)}>{children}</div>;
}

export function PageContent({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("lg:grow", className)}>{children}</div>;
}
