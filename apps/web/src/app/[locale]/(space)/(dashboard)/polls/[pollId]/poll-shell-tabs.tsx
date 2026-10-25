"use client";

import { usePathname } from "next/navigation";
import { Link } from "@/components/link";
import { pillVariants } from "@/components/pill-variants";
import { Trans } from "@/i18n/client";

export function PollShellTabs() {
  const pathname = usePathname();
  const basePath = pathname.replace(/\/(responses|results|activity)$/, "");

  const tabs = [
    {
      href: basePath,
      // The poll page opens Results while the poll is ready to decide, so
      // the tab asks for the overview by name.
      linkHref: `${basePath}?view=overview`,
      label: <Trans i18nKey="overview" defaults="Overview" />,
    },
    {
      href: `${basePath}/responses`,
      label: <Trans i18nKey="responses" defaults="Responses" />,
    },
    {
      href: `${basePath}/results`,
      label: <Trans i18nKey="results" defaults="Results" />,
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
            href={tab.linkHref ?? tab.href}
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
