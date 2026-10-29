"use client";
import { cn } from "@rallly/ui";
import React from "react";

/**
 * The page frame shared by the admin page and the invite page a manager
 * sees: a sticky header bar above a scrolling column. Both pages render
 * through it so moving between them does not shift the layout. The
 * header's border only shows once the content has scrolled beneath it.
 */
export function PollPageShell({
  header,
  actions,
  children,
}: {
  header: React.ReactNode;
  actions: React.ReactNode;
  children: React.ReactNode;
}) {
  const [scrolled, setScrolled] = React.useState(false);

  return (
    <div
      className="page-bg-gray-100 relative h-dvh overflow-auto dark:bg-gray-900"
      onScroll={(e) => setScrolled(e.currentTarget.scrollTop > 0)}
    >
      <div
        className={cn(
          "sticky top-0 z-40 border-b bg-gray-100/90 p-3 backdrop-blur-lg dark:bg-gray-900/90",
          !scrolled && "border-transparent",
        )}
      >
        <div className="flex justify-between gap-x-2">
          <div className="flex min-w-0 items-center gap-x-2.5">{header}</div>
          <div className="flex shrink-0 items-center gap-x-2">{actions}</div>
        </div>
      </div>
      <main id="main-content" tabIndex={-1} className="p-3">
        <div className="mx-auto max-w-4xl space-y-3">{children}</div>
      </main>
    </div>
  );
}
