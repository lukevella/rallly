"use client";

import { cn } from "@rallly/ui";
import { Skeleton } from "@rallly/ui/skeleton";

export function PageContainer({
  children,
  className,
}: React.PropsWithChildren<{ className?: string }>) {
  return (
    <div className={cn("mx-auto w-full p-4 md:px-8 md:py-6", className)}>
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
    <h1
      className={cn(
        "flex items-center gap-3 truncate font-bold text-foreground text-xl leading-none tracking-tight",
        className,
      )}
    >
      {children}
    </h1>
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
    <div className={cn("flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between", className)}>
      {children}
    </div>
  );
}

export function PageHeaderContent({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("min-w-0 flex-1", className)}>{children}</div>;
}

export function PageHeaderActions({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-2 sm:flex-shrink-0", className)}>
      {children}
    </div>
  );
}

export function PageSection({ children }: { children?: React.ReactNode }) {
  return <div className="space-y-4 md:space-y-6">{children}</div>;
}

export function PageSectionTitle({ children }: { children?: React.ReactNode }) {
  return <h2 className="text-muted-foreground text-sm">{children}</h2>;
}

export function PageContent({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mt-4 md:grow lg:mt-6", className)}>{children}</div>
  );
}

export function PageSkeleton() {
  return (
    <PageContainer>
      <PageHeader>
        <PageTitle>
          <Skeleton className="h-6 w-32" />
        </PageTitle>
      </PageHeader>
      <PageContent>
        <div className="space-y-8">
          <Skeleton className="h-8 w-1/2" />
          <div className="space-y-4">
            <Skeleton className="h-7 w-full" />
            <Skeleton className="h-7 w-full" />
            <Skeleton className="h-7 w-1/2" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-7 w-full" />
            <Skeleton className="h-7 w-full" />
            <Skeleton className="h-7 w-1/2" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-7 w-full" />
            <Skeleton className="h-7 w-full" />
            <Skeleton className="h-7 w-1/2" />
          </div>
        </div>
      </PageContent>
    </PageContainer>
  );
}
