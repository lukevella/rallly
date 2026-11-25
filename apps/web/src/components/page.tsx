// The layout every app page is built from: PageShell > PageHeader (PageColumn >
// PageTitle + PageToolbar) and PageContent (PageColumn > content).
import { cn } from "@rallly/ui";
import { SidebarTrigger } from "@rallly/ui/sidebar";
import { Skeleton } from "@rallly/ui/skeleton";
import { MenuIcon } from "lucide-react";

// Opens the sidebar on small screens, at the trailing edge of the page title.
function MobileMenuButton() {
  return (
    <SidebarTrigger className="ml-auto size-9 shrink-0 md:hidden">
      <MenuIcon className="size-5" />
    </SidebarTrigger>
  );
}

// Fills the dashboard shell's bounded main area: the header stays put and
// PageContent is the scroll area.
export function PageShell({
  children,
  className,
}: React.PropsWithChildren<{ className?: string }>) {
  return (
    <div className={cn("flex min-h-0 flex-1 flex-col", className)}>
      {children}
    </div>
  );
}

export function PageHeader({
  children,
  className,
}: React.PropsWithChildren<{ className?: string }>) {
  return <div className={cn("shrink-0", className)}>{children}</div>;
}

// The page title, at the top of a centred column (PageColumn) with the
// toolbar below. `actions` are page-wide (not tied to the toolbar's list)
// and sit at the trailing edge, before the mobile menu button.
export function PageTitle({
  children,
  actions,
  className,
}: React.PropsWithChildren<{ actions?: React.ReactNode; className?: string }>) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 px-4 pt-4 md:pt-8 lg:pt-12",
        className,
      )}
    >
      <h1 className="min-w-0 truncate font-semibold text-foreground text-xl tracking-tight md:text-2xl">
        {children}
      </h1>
      {/* One trailing group, so the actions and the menu button share the
          free space instead of each pushing itself right */}
      <div className="ml-auto flex shrink-0 items-center gap-2">
        {actions}
        <MobileMenuButton />
      </div>
    </div>
  );
}

export function PageTitleSkeleton() {
  return (
    <div className="flex items-center gap-2 px-4 pt-4 md:pt-8 lg:pt-12">
      <Skeleton aria-hidden className="h-7 w-28 md:h-8" />
      <MobileMenuButton />
    </div>
  );
}

// Placeholder for a toolbar holding a search input, tabs and a CTA.
// Wraps like PageToolbar: on small screens search and the CTA share the
// first row and the tabs take the full second row.
export function PageToolbarSkeleton({
  tabs = true,
  action = false,
}: {
  tabs?: boolean;
  action?: boolean;
}) {
  return (
    <div
      aria-hidden
      className="flex flex-wrap items-center gap-x-2 gap-y-4 px-4 pt-6 pb-3"
    >
      <Skeleton className="h-9 min-w-40 flex-1 rounded-control max-sm:order-first sm:min-w-48" />
      {tabs ? (
        <div className="flex items-center gap-2 max-sm:w-full">
          <Skeleton className="h-9 w-56 rounded-control" />
        </div>
      ) : null}
      {action ? (
        <Skeleton className="h-9 w-28 rounded-control max-sm:order-first" />
      ) : null}
    </div>
  );
}

// Centres a page's header and content in a max-w-5xl column. The scroll
// area stays full width so the scrollbar sits at the edge of the main area.
// Children bring their own px-4, so the gutter is 16px on small screens and
// 32px from md, matching the top padding of PageTitle.
export function PageColumn({
  children,
  className,
}: React.PropsWithChildren<{ className?: string }>) {
  return (
    <div className={cn("mx-auto w-full max-w-5xl md:px-4", className)}>
      {children}
    </div>
  );
}

export function PageActions({
  children,
  className,
}: React.PropsWithChildren<{ className?: string }>) {
  return (
    <div className={cn("ml-auto flex shrink-0 items-center gap-2", className)}>
      {children}
    </div>
  );
}

export function PageToolbar({
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

export function PageContent({
  children,
  className,
}: React.PropsWithChildren<{ className?: string }>) {
  return (
    <div className={cn("min-h-0 flex-1 overflow-y-auto", className)}>
      {children}
    </div>
  );
}
