import { cn } from "@rallly/ui";

export function StackedList({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("divide-y rounded-lg border", className)}>
      {children}
    </div>
  );
}

export function StackedListItem({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("p-1", className)}>{children}</div>;
}

export function StackedListItemContent({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("p-3", className)}>{children}</div>;
}
