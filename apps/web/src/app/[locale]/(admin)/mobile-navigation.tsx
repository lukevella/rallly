"use client";

import { Slot } from "@radix-ui/react-slot";
import { cn } from "@rallly/ui";
import { Button } from "@rallly/ui/button";
import {
  CalendarIcon,
  HomeIcon,
  MoreHorizontalIcon,
  PlusIcon,
  Settings2Icon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Trans } from "@/components/trans";

function MobileNavigationLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="group-hover:text-foreground group-focus:text-primary group-[.is-active]:text-primary text-muted-foreground truncate text-xs font-medium">
      {children}
    </span>
  );
}

function MobileNavigationIcon({ children }: { children: React.ReactNode }) {
  return (
    <Slot className="group-[.is-active]:text-primary group-focus:text-primary group-hover:text-foreground size-4 text-gray-500">
      {children}
    </Slot>
  );
}

function MobileNavigationItem({
  children,
  href,
}: {
  href: string;
  children?: React.ReactNode;
}) {
  const pathname = usePathname();
  return (
    <Link
      className={cn(
        "group flex grow basis-1/5 flex-col items-center gap-1 rounded-lg",
        {
          "is-active pointer-events-none": pathname === href,
        },
      )}
      href={href}
    >
      {children}
    </Link>
  );
}

export function MobileNavigation() {
  return (
    <div className="flex items-center justify-between gap-x-4">
      <MobileNavigationItem href="/">
        <MobileNavigationIcon>
          <HomeIcon />
        </MobileNavigationIcon>
        <MobileNavigationLabel>
          <Trans i18nKey="home" defaults="Home" />
        </MobileNavigationLabel>
      </MobileNavigationItem>
      <MobileNavigationItem href="/events">
        <MobileNavigationIcon>
          <CalendarIcon />
        </MobileNavigationIcon>
        <MobileNavigationLabel>
          <Trans i18nKey="events" defaults="Events" />
        </MobileNavigationLabel>
      </MobileNavigationItem>
      <Button asChild variant="primary">
        <Link href="/new">
          <PlusIcon className="size-4 text-white" />
        </Link>
      </Button>
      <MobileNavigationItem href="/settings/preferences">
        <MobileNavigationIcon>
          <Settings2Icon />
        </MobileNavigationIcon>
        <MobileNavigationLabel>
          <Trans i18nKey="settings" defaults="Settings" />
        </MobileNavigationLabel>
      </MobileNavigationItem>
      <MobileNavigationItem href="/menu">
        <MobileNavigationIcon>
          <MoreHorizontalIcon />
        </MobileNavigationIcon>
        <MobileNavigationLabel>
          <Trans i18nKey="more" defaults="More" />
        </MobileNavigationLabel>
      </MobileNavigationItem>
    </div>
  );
}
