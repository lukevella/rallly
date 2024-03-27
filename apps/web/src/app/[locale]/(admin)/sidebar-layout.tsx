"use client";

import { Slot } from "@radix-ui/react-slot";
import { cn } from "@rallly/ui";
import { Button } from "@rallly/ui/button";
import { Flex } from "@rallly/ui/flex";
import { Icon } from "@rallly/ui/icon";
import { MenuIcon, Settings2Icon, XIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

import { LogoLink } from "@/app/components/logo-link";
import { CurrentUserAvatar } from "@/components/user";

export function SidebarLayout({ children }: { children?: React.ReactNode }) {
  return <div className="mx-auto max-w-[1440px] bg-gray-100">{children}</div>;
}

export function SidebarMenuLabel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-4 text-xs font-semibold text-gray-400", className)}>
      {children}
    </div>
  );
}
export function SidebarNavigation({
  children,
}: {
  children?: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(false);
  return (
    <div
      className={cn(
        "flex flex-col lg:fixed lg:inset-y-0 lg:w-72 ",
        open ? "fixed inset-0 z-50 bg-gray-100" : "border-b lg:border-0",
      )}
    >
      <div
        className={cn("flex items-center justify-between px-3 py-2 lg:hidden")}
      >
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            setOpen((prev) => !prev);
          }}
        >
          <Icon>{open ? <XIcon /> : <MenuIcon />}</Icon>
        </Button>
        <Flex>
          <Button size="sm" variant="ghost" asChild>
            <Link href="/settings/preferences">
              <Icon>
                <Settings2Icon />
              </Icon>
            </Link>
          </Button>
          <Button size="sm" variant="ghost" asChild>
            <Link href="/settings/profile">
              <CurrentUserAvatar size="xs" />
            </Link>
          </Button>
        </Flex>
      </div>
      <nav
        className={cn(
          "flex flex-1 flex-col",
          "h-full p-5 lg:px-6 lg:py-5",
          open ? "" : "hidden lg:block",
        )}
      >
        {children}
      </nav>
    </div>
  );
}

export function SidebarContent({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("h-screen grow space-y-6 p-4 lg:ml-72", className)}>
      {children}
    </div>
  );
}
export function Sidebar({
  className,
  children,
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <ul role="list" className="flex h-full flex-1 flex-col gap-y-6">
      <li>
        <LogoLink />
      </li>
      {children}
    </ul>
  );
}

export function SidebarMenu({ children }: { children?: React.ReactNode }) {
  return (
    <ul role="list" className="space-y-1.5">
      {children}
    </ul>
  );
}

export function SidebarSection({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return <li className={cn("-mx-2", className)}>{children}</li>;
}

export function SidebarMenuLink({
  href,
  children,
}: {
  asChild?: boolean;
  href: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isCurrent = pathname === href;
  return (
    <li>
      <Link
        href={href}
        className={cn(
          isCurrent
            ? "is-active bg-gray-200 text-gray-800"
            : " text-gray-500 hover:bg-gray-200 hover:text-gray-800 active:bg-gray-300",
          "group flex h-9 items-center gap-x-3 rounded-md px-3 text-sm font-semibold",
        )}
      >
        {children}
      </Link>
    </li>
  );
}

export function SidebarMenuItemIcon({
  children,
}: {
  children?: React.ReactNode;
}) {
  return <Slot className="size-5 text-gray-400">{children}</Slot>;
}
