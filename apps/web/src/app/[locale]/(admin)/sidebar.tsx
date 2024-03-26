"use client";

import { cn } from "@rallly/ui";
import { Button } from "@rallly/ui/button";
import { Icon } from "@rallly/ui/icon";
import {
  BarChart2Icon,
  BlocksIcon,
  BookMarkedIcon,
  CalendarIcon,
  InboxIcon,
  LogInIcon,
  Settings2Icon,
  SparklesIcon,
  SquarePenIcon,
  UsersIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { UserMenu } from "@/app/[locale]/(admin)/user-menu";
import { ProBadge } from "@/components/pro-badge";
import { Trans } from "@/components/trans";
import { IfGuest } from "@/components/user-provider";
import { IfFreeUser } from "@/contexts/plan";
import { IconComponent } from "@/types";

function NavItem({
  href,
  children,
  icon: Icon,
  current,
}: {
  href: string;
  icon: IconComponent;
  children: React.ReactNode;
  current?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        current
          ? "bg-gray-200 text-gray-800"
          : "text-gray-500 hover:bg-gray-200 active:bg-gray-300",
        "group flex  items-center gap-x-3 rounded-md px-3 py-2 text-sm font-semibold leading-6",
      )}
    >
      <Icon
        className={cn(
          current ? "text-gray-500" : "text-gray-400 group-hover:text-gray-500",
          "size-5 shrink-0",
        )}
        aria-hidden="true"
      />
      {children}
    </Link>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  return (
    <nav className="flex flex-1 flex-col ">
      <ul role="list" className="flex flex-1 flex-col gap-y-6">
        <li>
          <ul role="list" className="-mx-2 space-y-1">
            <li>
              <NavItem
                current={pathname?.startsWith("/poll")}
                href="/polls"
                icon={BarChart2Icon}
              >
                <Trans i18nKey="polls" defaults="Polls" />
              </NavItem>
            </li>
            <li>
              <NavItem
                current={pathname?.startsWith("/inbox")}
                href="/inbox"
                icon={InboxIcon}
              >
                <Trans i18nKey="inbox" defaults="Inbox" />
              </NavItem>
            </li>
          </ul>
        </li>
        <li className="-mx-2 space-y-1">
          <Button className="w-full rounded-full" variant="primary" asChild>
            <Link href="/new">
              <Icon>
                <SquarePenIcon />
              </Icon>
              <Trans i18nKey="create" defaults="Create" />
            </Link>
          </Button>
        </li>
        <li>
          <div className="text-xs font-semibold leading-6 text-gray-400">
            <Trans i18nKey="comingSoon" defaults="Coming Soon" />
          </div>
          <ul role="list" className="-mx-2 mt-2 space-y-1">
            <li className="pointer-events-none grid gap-1 opacity-50">
              <NavItem href="/events" icon={CalendarIcon}>
                <Trans i18nKey="events" defaults="Events" />
              </NavItem>
              <NavItem href="/b" icon={BookMarkedIcon}>
                <Trans i18nKey="registrations" defaults="Registrations" />
              </NavItem>
              <NavItem href="/contacts" icon={UsersIcon}>
                <Trans i18nKey="contacts" defaults="Contacts" />
              </NavItem>
              <NavItem href="/integrations" icon={BlocksIcon}>
                <Trans i18nKey="integrations" defaults="Integrations" />
              </NavItem>
            </li>
          </ul>
        </li>
        <li className="mt-auto">
          <ul role="list" className="-mx-2 space-y-1">
            <IfFreeUser>
              <li>
                <Link
                  href="/settings/billing"
                  className="mb-4 grid rounded-md border border-gray-200 bg-gray-50 px-4 py-3 hover:border-gray-300 hover:bg-gray-200 active:bg-gray-300"
                >
                  <span className="mb-2 flex items-center gap-x-2">
                    <SparklesIcon className="size-5 text-gray-400" />
                    <span className="text-sm font-bold">
                      <Trans i18nKey="upgrade" />
                    </span>
                    <ProBadge />
                  </span>
                  <span className="text-sm leading-relaxed text-gray-500">
                    <Trans
                      i18nKey="unlockFeatures"
                      defaults="Unlock all Pro features."
                    />
                  </span>
                </Link>
              </li>
            </IfFreeUser>
            <IfGuest>
              <li>
                <NavItem href="/login" icon={LogInIcon}>
                  <Trans i18nKey="login" />
                </NavItem>
              </li>
            </IfGuest>
            <li>
              <NavItem href="/settings/preferences" icon={Settings2Icon}>
                <Trans i18nKey="preferences" />
              </NavItem>
            </li>
          </ul>
          <hr className="my-2" />
          <ul role="list" className="-mx-2 space-y-1">
            <li>
              <UserMenu />
            </li>
          </ul>
        </li>
      </ul>
    </nav>
  );
}
