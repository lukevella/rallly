import { cn } from "@rallly/ui";
import { SidebarTrigger } from "@rallly/ui/sidebar";

// Fills the dashboard shell's bounded main area: the header stays put and
// ListViewContent is the scroll area.
export function ListView({
  children,
  className,
}: React.PropsWithChildren<{ className?: string }>) {
  return (
    <div className={cn("flex min-h-0 flex-1 flex-col", className)}>
      {children}
    </div>
  );
}

export function ListViewHeader({
  children,
  className,
}: React.PropsWithChildren<{ className?: string }>) {
  return (
    <div className={cn("shrink-0 bg-background", className)}>{children}</div>
  );
}

export function ListViewTitleBar({
  children,
  className,
}: React.PropsWithChildren<{ className?: string }>) {
  return (
    <div
      className={cn(
        "flex h-16 items-end justify-between gap-4 pr-4 pb-1 pl-4 md:pl-6",
        className,
      )}
    >
      <div className="flex h-9 min-w-0 flex-1 items-center gap-2">
        <SidebarTrigger className="md:hidden" />
        {children}
      </div>
    </div>
  );
}

// Same type as PageTitle on the other dashboard pages; the sidebar trigger
// lives in ListViewTitleBar instead.
export function ListViewTitle({
  children,
  className,
}: React.PropsWithChildren<{ className?: string }>) {
  return (
    <h1
      className={cn(
        "truncate font-display font-semibold text-foreground text-lg tracking-tight",
        className,
      )}
    >
      {children}
    </h1>
  );
}

export function ListViewActions({
  children,
  className,
}: React.PropsWithChildren<{ className?: string }>) {
  return (
    <div className={cn("ml-auto flex shrink-0 items-center gap-2", className)}>
      {children}
    </div>
  );
}

export function ListViewToolbar({
  children,
  className,
}: React.PropsWithChildren<{ className?: string }>) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-x-2 gap-y-4 px-4 pt-4 pb-3",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function ListViewContent({
  children,
  className,
}: React.PropsWithChildren<{ className?: string }>) {
  return (
    <div className={cn("min-h-0 flex-1 overflow-y-auto", className)}>
      {children}
    </div>
  );
}
