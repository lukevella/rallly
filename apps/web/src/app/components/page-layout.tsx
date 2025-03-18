"use client";

import { cn } from "@rallly/ui";
import { Skeleton } from "@rallly/ui/skeleton";

export function PageContainer({
  children,
  className,
}: React.PropsWithChildren<{ className?: string }>) {
  return (
    <div className={cn("mx-auto w-full max-w-5xl", className)}>{children}</div>
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
        "text-foreground inline-flex items-center truncate text-2xl font-bold tracking-tight",
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
        <PageTitle>
          <Skeleton className="h-8 w-32" />
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
