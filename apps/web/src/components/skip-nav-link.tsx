"use client";

import { Trans } from "@/i18n/client";

export function SkipNavLink() {
  return (
    <a
      href="#main-content"
      className="sr-only rounded-md bg-background font-medium text-foreground text-sm shadow-md ring-2 ring-ring focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-100 focus:px-4 focus:py-2"
    >
      <Trans i18nKey="skipToContent" defaults="Skip to main content" />
    </a>
  );
}
