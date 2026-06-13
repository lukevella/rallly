import { cn } from "@rallly/ui";

export function RsvpCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn("rounded-2xl border border-card-border bg-card", className)}
    >
      {children}
    </div>
  );
}

export function RsvpCardTitle({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p className={cn("border-b p-3 font-medium text-sm", className)}>
      {children}
    </p>
  );
}

export function RsvpCardContent({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("grid gap-4 p-3", className)}>{children}</div>;
}
