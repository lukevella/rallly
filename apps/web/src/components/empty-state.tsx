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
        "flex flex-col items-center justify-center py-16 text-center",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function EmptyStateIcon({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-4 inline-flex rounded-xl bg-muted p-3 shadow-xs ring-1 ring-button-outline ring-inset">
      <Icon size="lg">{children}</Icon>
    </div>
  );
}

export function EmptyStateTitle({ children }: { children: React.ReactNode }) {
  return <p className="font-semibold text-base">{children}</p>;
}

export function EmptyStateDescription({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <p className="mt-2 max-w-md text-pretty text-muted-foreground text-sm leading-relaxed">
      {children}
    </p>
  );
}

export function EmptyStateFooter({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("mt-6", className)}>{children}</div>;
}
