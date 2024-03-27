import { cn } from "@rallly/ui";
import { Icon } from "@rallly/ui/icon";

export function EmptyState({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("w-full", className)}>
      <div className="mx-auto flex w-full flex-col items-center justify-center rounded-md border bg-white p-16 text-center">
        {children}
      </div>
    </div>
  );
}

export function EmptyStateIcon({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-4 inline-flex rounded-full border p-4">
      <Icon size="lg">{children}</Icon>
    </div>
  );
}

export function EmptyStateTitle({ children }: { children: React.ReactNode }) {
  return <p className="text-base font-semibold">{children}</p>;
}

export function EmptyStateDescription({
  children,
}: {
  children: React.ReactNode;
}) {
  return <p className="text-muted-foreground text-sm">{children}</p>;
}

export function EmptyStateFooter({ children }: { children: React.ReactNode }) {
  return <div className="mt-4">{children}</div>;
}
