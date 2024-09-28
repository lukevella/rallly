"use client";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@rallly/ui";

import { Heading } from "@/components/heading";

export function PageContainer({
  children,
  className,
}: React.PropsWithChildren<{ className?: string }>) {
  return <div className={cn("space-y-6", className)}>{children}</div>;
}

export function PageIcon({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("hidden rounded-md border bg-gray-50 p-2", className)}>
      <Slot className="size-4">{children}</Slot>
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
  return <Heading className={className}>{children}</Heading>;
}

export function PageHeader({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
  variant?: "default" | "ghost";
}) {
  return (
    <div className={cn("flex items-center gap-x-4", className)}>{children}</div>
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
  return <div className={cn("md:grow", className)}>{children}</div>;
}
