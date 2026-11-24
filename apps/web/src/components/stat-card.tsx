import { cn } from "@rallly/ui";
import { HoverPrefetchLink } from "@/components/hover-prefetch-link";

// A summary card: a header with the label and an optional detail badge
// (StatCardDetail) on the right, and a footer with a large value and an
// optional action.
export function StatCard({
  href,
  className,
  children,
}: React.PropsWithChildren<{ href?: string; className?: string }>) {
  const classes = cn(
    "flex min-h-32 min-w-72 flex-1 snap-start flex-col justify-between gap-4 rounded-xl bg-card p-4 text-card-foreground shadow-xs ring-1 ring-button-outline ring-inset sm:min-w-64 dark:bg-foreground/5 dark:shadow-none",
    href && "transition-colors hover:bg-foreground/10",
    className,
  );

  if (!href) {
    return <div className={classes}>{children}</div>;
  }

  return (
    <HoverPrefetchLink href={href} className={classes}>
      {children}
    </HoverPrefetchLink>
  );
}

export function StatCardLabel({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn(
        "min-w-0 truncate text-muted-foreground text-sm",
        className,
      )}
      {...props}
    />
  );
}

export function StatCardHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex items-start justify-between gap-2", className)}
      {...props}
    />
  );
}

export function StatCardFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex items-end justify-between gap-2", className)}
      {...props}
    />
  );
}

export function StatCardValue({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "font-normal text-3xl text-foreground tabular-nums tracking-tight",
        className,
      )}
      {...props}
    />
  );
}

export function StatCardDetail({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "inline-flex shrink-0 items-center gap-1 whitespace-nowrap text-muted-foreground text-sm [&_svg]:size-3.5 [&_svg]:shrink-0",
        className,
      )}
      {...props}
    />
  );
}

export function StatCardStack({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "-mx-4 flex snap-x scroll-px-4 gap-4 overflow-x-auto px-4 pb-2 [scrollbar-width:thin] md:mx-0 md:scroll-px-0 md:px-0 md:pb-0",
        className,
      )}
      {...props}
    />
  );
}
