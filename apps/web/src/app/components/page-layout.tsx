"use client";

import { cn } from "@rallly/ui";
import { SidebarTrigger } from "@rallly/ui/sidebar";
import { Skeleton } from "@rallly/ui/skeleton";
import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";

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
        "flex items-center gap-3 truncate font-semibold text-foreground text-lg tracking-tight",
        className,
      )}
    >
      <SidebarTrigger className="md:hidden" />
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
    <div className={cn("flex items-start justify-between gap-4", className)}>
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

export function PageContent({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mt-4 md:mt-6 md:grow", className)}>{children}</div>
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

export function PageSectionGroup({ children }: { children?: React.ReactNode }) {
  return <div className="space-y-6">{children}</div>;
}

const pageSectionVariants = cva("flex flex-col gap-4", {
  variants: {
    variant: {
      card: "rounded-2xl border p-4",
      default: "",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

export const PageSectionDivider = () => <hr />;

export function PageSection({
  children,
  className,
  variant,
}: {
  children?: React.ReactNode;
  className?: string;
} & VariantProps<typeof pageSectionVariants>) {
  return (
    <section className={cn(pageSectionVariants({ variant }), className)}>
      {children}
    </section>
  );
}

export function PageSectionHeader({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return <div className={cn(className)}>{children}</div>;
}

export function PageSectionTitle({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <h2 className={cn("font-medium text-base text-foreground", className)}>
      {children}
    </h2>
  );
}

export function PageSectionDescription({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <p
      className={cn(
        "mt-0.5 text-pretty text-muted-foreground text-sm leading-normal",
        className,
      )}
    >
      {children}
    </p>
  );
}

export function PageSectionContent({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("space-y-4", className)}>{children}</div>;
}
