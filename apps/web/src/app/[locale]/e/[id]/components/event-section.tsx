import { cn } from "@rallly/ui";

export function EventSection({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <section className={cn("grid gap-2", className)}>{children}</section>;
}

export function EventSectionTitle({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <h2 className={cn("text-muted-foreground text-sm", className)}>
      {children}
    </h2>
  );
}
