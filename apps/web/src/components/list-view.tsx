import { cn } from "@rallly/ui";
import { SidebarTrigger } from "@rallly/ui/sidebar";
import { Skeleton } from "@rallly/ui/skeleton";

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
  return <div className={cn("shrink-0", className)}>{children}</div>;
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
        "truncate font-semibold text-foreground text-lg tracking-tight",
        className,
      )}
    >
      {children}
    </h1>
  );
}

// Large page title for top-level list pages that sit in a centred column
// (ListViewColumn) with the toolbar below.
export function ListViewPageTitle({
  children,
  className,
}: React.PropsWithChildren<{ className?: string }>) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 px-4 pt-4 md:pt-8 lg:pt-12",
        className,
      )}
    >
      <SidebarTrigger className="md:hidden" />
      <h1 className="truncate font-semibold text-foreground text-xl tracking-tight md:text-2xl">
        {children}
      </h1>
    </div>
  );
}

export function ListViewPageTitleSkeleton() {
  return (
    <div
      aria-hidden
      className="flex items-center gap-2 px-4 pt-4 md:pt-8 lg:pt-12"
    >
      <SidebarTrigger className="md:hidden" />
      <Skeleton className="h-7 w-28 md:h-8" />
    </div>
  );
}

// Placeholder for a toolbar holding a search input, FilterTabs and a CTA.
export function ListViewToolbarSkeleton({
  tabs = true,
  action = false,
}: {
  tabs?: boolean;
  action?: boolean;
}) {
  return (
    <div aria-hidden className="flex items-center gap-2 px-4 pt-6 pb-3">
      <Skeleton className="h-9 min-w-0 flex-1 rounded-md" />
      {tabs ? <Skeleton className="h-9 w-56 rounded-xl" /> : null}
      {action ? <Skeleton className="h-9 w-28 rounded-xl" /> : null}
    </div>
  );
}

// Centres a list page's header and content in a max-w-5xl column. The scroll
// area stays full width so the scrollbar sits at the edge of the main area.
// Children bring their own px-4, so the gutter is 16px on small screens and
// 32px from md, matching the top padding of ListViewPageTitle.
export function ListViewColumn({
  children,
  className,
}: React.PropsWithChildren<{ className?: string }>) {
  return (
    <div className={cn("mx-auto w-full max-w-5xl md:px-4", className)}>
      {children}
    </div>
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
