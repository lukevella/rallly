"use client";

import { cn } from "@rallly/ui";
import { Button } from "@rallly/ui/button";
import { DialogTrigger } from "@rallly/ui/dialog";
import { Icon } from "@rallly/ui/icon";
import {
  ArrowUpRightIcon,
  BarChart2Icon,
  CalendarIcon,
  ChevronRightIcon,
  HomeIcon,
  LifeBuoyIcon,
  LogInIcon,
  Settings2Icon,
  SparklesIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { OptimizedAvatarImage } from "@/components/optimized-avatar-image";
import { PayWallDialog } from "@/components/pay-wall-dialog";
import { ProBadge } from "@/components/pro-badge";
import { Trans } from "@/components/trans";
import { IfGuest, useUser } from "@/components/user-provider";
import { IfFreeUser } from "@/contexts/plan";
import { IconComponent } from "@/types";
import { usePostHog } from "@/utils/posthog";

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
          ? "text-foreground bg-gray-100"
          : "text-muted-foreground hover:text-foreground border-transparent hover:bg-gray-100 focus:bg-gray-200",
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
  const posthog = usePostHog();
  return (
    <nav className="flex flex-1 flex-col ">
      <ul role="list" className="flex flex-1 flex-col gap-y-8">
        <li>
          <ul role="list" className="-mx-2 space-y-2">
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
        <li className="mt-auto">
          <ul role="list" className="-mx-2 space-y-1">
            <IfFreeUser>
              <li>
                <PayWallDialog>
                  <DialogTrigger
                    onClick={() =>
                      posthog?.capture("trigger paywall", { from: "sidebar" })
                    }
                    asChild
                  >
                    <button className="bg-primary-50 text-primary hover:bg-primary-100 focus:bg-primary-200 mb-4 flex w-full flex-col rounded-lg px-4 py-3">
                      <span className="mb-2 flex items-center gap-x-2">
                        <SparklesIcon className="size-5 opacity-50" />
                        <span className="text-sm font-bold">
                          <Trans i18nKey="upgrade" />
                        </span>
                        <ProBadge />
                      </span>
                      <span className="text-sm leading-relaxed opacity-75">
                        <Trans
                          i18nKey="unlockFeatures"
                          defaults="Unlock all Pro features."
                        />
                      </span>
                    </button>
                  </DialogTrigger>
                </PayWallDialog>
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
                    <OptimizedAvatarImage
                      src={user.image ?? undefined}
                      name={user.name}
                      size="md"
                    />
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
