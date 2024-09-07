"use client";

import { cn } from "@rallly/ui";
import { Button } from "@rallly/ui/button";
import { Icon } from "@rallly/ui/icon";
import {
  ArrowUpRightIcon,
  BarChart2Icon,
  CalendarIcon,
  ChevronRightIcon,
  HomeIcon,
  LifeBuoyIcon,
  LogInIcon,
  PlusIcon,
  Settings2Icon,
  SparklesIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { CurrentUserAvatar } from "@/components/current-user-avatar";
import { ProBadge } from "@/components/pro-badge";
import { Trans } from "@/components/trans";
import { IfGuest, useUser } from "@/components/user-provider";
import { IfFreeUser } from "@/contexts/plan";
import { IconComponent } from "@/types";

function NavItem({
  href,
  children,
  target,
  icon: Icon,
  current,
}: {
  href: string;
  target?: string;
  icon: IconComponent;
  children: React.ReactNode;
  current?: boolean;
}) {
  return (
    <Link
      href={href}
      target={target}
      className={cn(
        current
          ? "text-foreground bg-gray-200"
          : "text-muted-foreground border-transparent hover:bg-gray-200 focus:bg-gray-300",
        "group flex items-center gap-x-3 rounded-md px-3 py-2 text-sm font-semibold leading-6",
      )}
    >
      <Icon className={cn("size-5 shrink-0")} aria-hidden="true" />
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
              <NavItem current={pathname === "/"} href="/" icon={HomeIcon}>
                <Trans i18nKey="home" defaults="Home" />
              </NavItem>
            </li>
            <li>
              <NavItem
                current={pathname?.startsWith("/polls")}
                href="/polls"
                icon={BarChart2Icon}
              >
                <Trans i18nKey="polls" defaults="Polls" />
              </NavItem>
            </li>
            <li>
              <NavItem
                current={pathname?.startsWith("/events")}
                href="/events"
                icon={CalendarIcon}
              >
                <Trans i18nKey="events" defaults="Events" />
              </NavItem>
            </li>
          </ul>
        </li>
        <li className="-mx-2 space-y-1">
          <Button variant="primary" className="w-full rounded-full" asChild>
            <Link href="/new">
              <Icon>
                <PlusIcon />
              </Icon>
              <Trans i18nKey="create" defaults="create" />
            </Link>
          </Button>
        </li>
        <li className="mt-auto">
          <ul role="list" className="-mx-2 space-y-1">
            <IfFreeUser>
              <li>
                <Link
                  href="/settings/billing"
                  className="mb-4 grid rounded-md border bg-gray-50 px-4 py-3 focus:border-gray-300 focus:bg-gray-200"
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
              <NavItem
                target="_blank"
                href="https://support.rallly.co"
                icon={LifeBuoyIcon}
              >
                <Trans i18nKey="support" />
                <Icon>
                  <ArrowUpRightIcon />
                </Icon>
              </NavItem>
            </li>
            <li>
              <NavItem
                href="/settings/preferences"
                current={pathname === "/settings/preferences"}
                icon={Settings2Icon}
              >
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
                className="group h-auto w-full justify-start py-3"
              >
                <Link href="/settings/profile">
                  <div>
                    <CurrentUserAvatar />
                  </div>
                  <span className="ml-1 grid grow">
                    <span className="font-semibold">{user.name}</span>
                    <span className="text-muted-foreground truncate text-sm">
                      {user.email}
                    </span>
                  </span>
                  <ChevronRightIcon className="text-muted-foreground size-4 opacity-0 group-hover:opacity-100" />
                </Link>
              </Button>
            </li>
          </ul>
        </li>
      </ul>
    </nav>
  );
}
