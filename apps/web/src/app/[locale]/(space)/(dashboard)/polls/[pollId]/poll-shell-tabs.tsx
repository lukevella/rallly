"use client";

import { usePathname } from "next/navigation";
import { Link } from "@/components/link";
import { pillVariants } from "@/components/pill-variants";
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
    <nav className="flex items-center gap-1">
      {tabs.map((tab) => {
        const isActive = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={isActive ? "page" : undefined}
            className={pillVariants({ selected: isActive })}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
