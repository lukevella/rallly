"use client";

import { Slot } from "@radix-ui/react-slot";
import { cn } from "@rallly/ui";
import { Button } from "@rallly/ui/button";
import {
  BarChart2Icon,
  CalendarIcon,
  HomeIcon,
  MenuIcon,
  PlusIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

function MobileNavigationIcon({ children }: { children: React.ReactNode }) {
  return (
    <Slot className="group-[.is-active]:text-primary group-focus:text-primary group-hover:text-foreground size-5 text-gray-500">
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
      </MobileNavigationItem>
      <MobileNavigationItem href="/polls">
        <MobileNavigationIcon>
          <BarChart2Icon />
        </MobileNavigationIcon>
      </MobileNavigationItem>
      <Button asChild variant="primary">
        <Link href="/new">
          <PlusIcon className="size-5 text-white" />
        </Link>
      </Button>
      <MobileNavigationItem href="/events">
        <MobileNavigationIcon>
          <CalendarIcon />
        </MobileNavigationIcon>
      </MobileNavigationItem>
      <MobileNavigationItem href="/menu">
        <MobileNavigationIcon>
          <MenuIcon />
        </MobileNavigationIcon>
      </MobileNavigationItem>
    </div>
  );
}
