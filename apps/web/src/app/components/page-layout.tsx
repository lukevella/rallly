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
        "max-w-4xl  lg:flex lg:h-screen lg:flex-col lg:pr-4",
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
}: {
  children?: React.ReactNode;
  className?: string;
  variant?: "default" | "ghost";
}) {
  return <div className={cn("p-4", className)}>{children}</div>;
}

export function PageContent({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("px-4 pb-4 lg:grow", className)}>{children}</div>;
}
