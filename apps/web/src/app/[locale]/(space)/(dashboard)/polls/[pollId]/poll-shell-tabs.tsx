"use client";

import { cn } from "@rallly/ui";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Trans } from "@/i18n/client";

export function PollShellTabs() {
  const pathname = usePathname();
  const basePath = pathname.replace(/\/(responses|dates|activity)$/, "");

  const tabs = [
    {
      href: basePath,
      label: <Trans i18nKey="overview" defaults="Overview" />,
    },
    {
      href: `${basePath}/responses`,
      label: <Trans i18nKey="responses" defaults="Responses" />,
    },
    {
      href: `${basePath}/dates`,
      label: <Trans i18nKey="dates" defaults="Dates" />,
    },
    {
      href: `${basePath}/activity`,
      label: <Trans i18nKey="activity" defaults="Activity" />,
    },
  ];

  return (
    <nav className="flex space-x-4 border-b border-b-border">
      {tabs.map((tab) => {
        const isActive = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "-mb-px inline-flex h-9 items-center whitespace-nowrap border-b-2 px-1 pt-1 pb-1 font-medium text-sm transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              isActive
                ? "border-foreground text-foreground"
                : "border-transparent text-muted-foreground hover:border-accent-border hover:text-accent-foreground",
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
