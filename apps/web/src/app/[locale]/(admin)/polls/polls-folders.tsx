"use client";

import { cn } from "@rallly/ui";
import { Button } from "@rallly/ui/button";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

import { Trans } from "@/components/trans";

function PollFolder({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname() ?? "";
  const searchParams = useSearchParams();
  const query = searchParams?.has("status")
    ? `?${searchParams?.toString()}`
    : "";
  const currentUrl = pathname + query;
  const isActive = href === currentUrl;
  return (
    <Button
      asChild
      className={cn(
        isActive
          ? "bg-gray-100"
          : "text-muted-foreground shadow-sm hover:bg-gray-100 active:bg-gray-200",
      )}
    >
      <Link href={href}>{children}</Link>
    </Button>
  );
}

export function PollFolders() {
  return (
    <div className="flex flex-wrap gap-3">
      <PollFolder href="/polls">
        <Trans i18nKey="pollStatusAll" defaults="All" />
      </PollFolder>
      <PollFolder href="/polls?status=live">
        <Trans i18nKey="pollStatusLive" defaults="Live" />
      </PollFolder>
      <PollFolder href="/polls?status=paused">
        <Trans i18nKey="pollStatusPaused" defaults="Paused" />
      </PollFolder>
      <PollFolder href="/polls?status=finalized">
        <Trans i18nKey="pollStatusFinalized" defaults="Finalized" />
      </PollFolder>
    </div>
  );
}
