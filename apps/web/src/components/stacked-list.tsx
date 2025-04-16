import { cn } from "@rallly/ui";

export function StackedList({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <ul className={cn("divide-y overflow-hidden rounded-lg border", className)}>
      {children}
    </ul>
  );
}

export function StackedListItem({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <li
      className={cn(
        "flex items-center gap-x-6 p-4 hover:bg-gray-50",
        className,
      )}
    >
      {children}
    </li>
  );
}
