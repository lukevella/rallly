"use client";
import { cn } from "@rallly/ui";
import { Icon } from "@rallly/ui/icon";

export function PageContainer({
  children,
  className,
}: React.PropsWithChildren<{ className?: string }>) {
  return (
    <div className={cn("h-full grow p-3 sm:p-4 sm:pr-8", className)}>
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
        "inline-flex h-9 items-center truncate text-xl font-bold",
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
  return <div className={cn("mb-3 sm:mb-6", className)}>{children}</div>;
}

export function PageSection({ children }: { children?: React.ReactNode }) {
  return <div className="space-y-4 sm:space-y-6">{children}</div>;
}

export function PageSectionTitle({ children }: { children?: React.ReactNode }) {
  return <h2 className="text-muted-foreground">{children}</h2>;
}

export function PageContent({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("sm:grow", className)}>{children}</div>;
}
