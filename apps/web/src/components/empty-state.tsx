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
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function EmptyStateIcon({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-4 inline-flex rounded-full border p-4">
      <Icon size="xl">{children}</Icon>
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
  return (
    <p className="text-muted-foreground mt-2 max-w-md text-pretty text-sm leading-relaxed">
      {children}
    </p>
  );
}

export function EmptyStateFooter({ children }: { children: React.ReactNode }) {
  return <div className="mt-6">{children}</div>;
}
