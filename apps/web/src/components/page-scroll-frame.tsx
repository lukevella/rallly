"use client";

import { cn } from "@rallly/ui";
import React from "react";

/**
 * PageShell's top bar over its scroll area. The bar gains a bottom border once
 * the content has scrolled, marking where the content slides under it.
 */
export function PageScrollFrame({
  nav,
  navActions,
  children,
}: React.PropsWithChildren<{
  nav?: React.ReactNode;
  navActions?: React.ReactNode;
}>) {
  const [scrolled, setScrolled] = React.useState(false);

  return (
    <>
      <div
        className={cn(
          // Always a border, transparent at the top, so the bar never resizes.
          "flex h-12 shrink-0 items-center gap-4 border-b px-4 transition-colors md:h-14",
          scrolled ? "border-border" : "border-transparent",
        )}
      >
        <div className="min-w-0 flex-1">{nav}</div>
        {navActions ? (
          <div className="flex shrink-0 items-center gap-2">{navActions}</div>
        ) : null}
      </div>
      <div
        className="relative flex min-h-0 flex-1 flex-col overflow-y-auto"
        onScroll={(event) => setScrolled(event.currentTarget.scrollTop > 0)}
      >
        {children}
      </div>
    </>
  );
}
