import { cn } from "@rallly/ui";
import { SidebarTrigger } from "@rallly/ui/sidebar";

/**
 * The page shell every dashboard page is moving to: a sticky h-14 header
 * (start, centre, end) above content that scrolls with the dashboard's own
 * scroll container. Content that sticks below the header uses top-14.
 *
 * The shell grows with its content (no min-h-0) so the sticky header has the
 * whole page to stick within.
 */
export function PageShell({
  children,
  className,
}: React.PropsWithChildren<{ className?: string }>) {
  return (
    <div className={cn("flex flex-1 flex-col", className)}>{children}</div>
  );
}

/**
 * One h-14 row from md up. The equal 1fr side columns keep the centre slot
 * at the true centre whatever the start and end widths. Below md the centre
 * slot wraps onto a second row.
 */
export function PageShellHeader({
  children,
  className,
}: React.PropsWithChildren<{ className?: string }>) {
  return (
    <header
      className={cn(
        "sticky top-0 z-10 flex shrink-0 flex-wrap items-center gap-x-2 bg-sidebar px-6 md:grid md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]",
        className,
      )}
    >
      {children}
    </header>
  );
}

/** Title side: the mobile sidebar trigger, then whatever leads the page. */
export function PageShellHeaderStart({
  children,
  className,
}: React.PropsWithChildren<{ className?: string }>) {
  return (
    <div
      className={cn("flex h-14 min-w-0 flex-1 items-center gap-2", className)}
    >
      <SidebarTrigger className="md:hidden" />
      {children}
    </div>
  );
}

export function PageShellHeaderCenter({
  children,
  className,
}: React.PropsWithChildren<{ className?: string }>) {
  return (
    <div
      className={cn(
        "order-last flex h-10 w-full items-center md:order-none md:h-14 md:w-auto",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function PageShellHeaderEnd({
  children,
  className,
}: React.PropsWithChildren<{ className?: string }>) {
  return (
    <div
      className={cn(
        "flex h-14 shrink-0 items-center gap-2 md:justify-self-end",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function PageShellTitle({
  children,
  className,
}: React.PropsWithChildren<{ className?: string }>) {
  return (
    <h1
      className={cn("truncate font-medium text-foreground text-sm", className)}
    >
      {children}
    </h1>
  );
}

export function PageShellContent({
  children,
  className,
}: React.PropsWithChildren<{ className?: string }>) {
  return (
    <div className={cn("flex flex-1 flex-col", className)}>{children}</div>
  );
}
