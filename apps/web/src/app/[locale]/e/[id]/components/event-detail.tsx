import { cn } from "@rallly/ui";

export function EventDetail({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-4", className)}>{children}</div>
  );
}

export function EventDetailTile({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "inline-flex size-12 flex-col overflow-hidden rounded-xl border bg-card text-center text-card-foreground",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function EventDetailIcon({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <EventDetailTile
      className={cn("items-center justify-center [&>svg]:size-5", className)}
    >
      {children}
    </EventDetailTile>
  );
}

export function EventDetailContent({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn(className)}>{children}</div>;
}

export function EventDetailTitle({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("font-medium text-base text-foreground", className)}>
      {children}
    </div>
  );
}

export function EventDetailDescription({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("text-muted-foreground text-sm", className)}>
      {children}
    </div>
  );
}
