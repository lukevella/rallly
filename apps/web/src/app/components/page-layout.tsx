"use client";

import { cn } from "@rallly/ui";
import { Skeleton } from "@rallly/ui/skeleton";

export function PageContainer({
  children,
  className,
}: React.PropsWithChildren<{ className?: string }>) {
  return (
    <div className={cn("mx-auto w-full max-w-7xl", className)}>{children}</div>
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
        "text-foreground inline-flex items-center truncate text-xl font-bold tracking-tight",
        className,
      )}
    >
      {children}
    </h1>
  );
}

export function PageDescription({
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

export function PageHeader({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
  variant?: "default" | "ghost";
}) {
  return <div className={cn("mb-6", className)}>{children}</div>;
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
  return <div className={cn("md:grow", className)}>{children}</div>;
}

export function PageSkeleton() {
  return (
    <PageContainer>
      <PageHeader>
        <Skeleton className="mb-3 size-8" />
        <PageTitle>
          <Skeleton className="h-8 w-32" />
        </PageTitle>
        <PageDescription>
          <Skeleton className="h-4 w-64" />
        </PageDescription>
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
