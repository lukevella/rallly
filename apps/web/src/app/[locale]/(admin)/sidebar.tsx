"use client";

import { cn } from "@rallly/ui";
import { Button } from "@rallly/ui/button";
import {
  BlocksIcon,
  BookMarkedIcon,
  CalendarIcon,
  ChevronRightIcon,
  LogInIcon,
  Settings2Icon,
  SparklesIcon,
  UsersIcon,
  VoteIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { ProBadge } from "@/components/pro-badge";
import { Trans } from "@/components/trans";
import { CurrentUserAvatar } from "@/components/user";
import { IfGuest, useUser } from "@/components/user-provider";
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
          : "text-gray-700 hover:bg-gray-200 active:bg-gray-300",
        "group flex  items-center gap-x-3 rounded-md py-2 px-3 text-sm leading-6 font-semibold",
      )}
    >
      <Icon
        className={cn(
          current ? "text-gray-500" : "text-gray-400 group-hover:text-gray-500",
          "h-5 w-5 shrink-0",
        )}
        aria-hidden="true"
      />
      {children}
    </Link>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useUser();
  return (
    <nav className="flex flex-1 flex-col ">
      <ul role="list" className="flex flex-1 flex-col gap-y-7">
        <li>
          <ul role="list" className="-mx-2 space-y-1">
            <li>
              <NavItem
                current={pathname?.startsWith("/poll")}
                href="/polls"
                icon={VoteIcon}
              >
                <Trans i18nKey="polls" defaults="Polls" />
              </NavItem>
            </li>
          </ul>
        </li>
        <li>
          <div className="text-xs font-semibold leading-6 text-gray-400">
            <Trans i18nKey="comingSoon" defaults="Coming Soon" />
          </div>
          <ul role="list" className="-mx-2 mt-2 space-y-1">
            <li className="grid gap-1 pointer-events-none opacity-50">
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
                  className="border rounded-md mb-4 px-4 py-3 bg-gray-50 hover:bg-gray-200 active:bg-gray-300 border-gray-200 hover:border-gray-300 grid"
                >
                  <span className="flex mb-2 items-center gap-x-2">
                    <SparklesIcon className="h-5 text-gray-400 w-5" />
                    <span className="font-bold text-sm">
                      <Trans i18nKey="upgrade" />
                    </span>
                    <ProBadge />
                  </span>
                  <span className="text-gray-500 leading-relaxed text-sm">
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
              <Button
                asChild
                variant="ghost"
                className="group h-auto py-3 w-full justify-start"
              >
                <Link href="/settings/profile">
                  <CurrentUserAvatar />
                  <span className="grid ml-1 grow">
                    <span className="font-semibold">{user.name}</span>
                    <span className="text-muted-foreground text-sm">
                      {user.email}
                    </span>
                  </span>
                  <ChevronRightIcon className="h-4 w-4 opacity-0 group-hover:opacity-100 text-muted-foreground" />
                </Link>
              </Button>
            </li>
          </ul>
        </li>
      </ul>
    </nav>
  );
}
