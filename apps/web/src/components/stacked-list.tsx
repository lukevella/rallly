import { cn } from "@rallly/ui";

export function StackedList({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <ul className={cn("divide-y rounded-lg border", className)}>{children}</ul>
  );
}

export function StackedListItem({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <li className={cn(className)}>{children}</li>;
}

export function StackedListItemContent({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("p-4", className)}>{children}</div>;
}
