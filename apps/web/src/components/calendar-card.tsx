import { cn } from "@rallly/ui";

export function CalendarCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "inline-flex size-12 flex-col overflow-hidden rounded-xl border bg-muted text-center text-card-foreground",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function CalendarCardMonth({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "bg-muted font-normal text-[10px] text-muted-foreground uppercase leading-4",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function CalendarCardDay({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex grow items-center justify-center bg-card font-semibold text-base text-foreground leading-none tracking-tight",
        className,
      )}
    >
      {children}
    </div>
  );
}
