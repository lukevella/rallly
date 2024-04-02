"use client";

import { Slot } from "@radix-ui/react-slot";
import { cn } from "@rallly/ui";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

export function SidebarMenuGroup() {}
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
export function Sidebar({
  className,
  children,
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <ul
      role="list"
      className={cn("flex h-full flex-1 flex-col gap-y-6", className)}
    >
      {children}
    </ul>
  );
}

export function SidebarMenu({ children }: { children?: React.ReactNode }) {
  return (
    <ul role="list" className="-mx-2 space-y-1.5">
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
  return <li className={cn("", className)}>{children}</li>;
}

export function SidebarMenuLink({
  href,
  className,
  children,
}: {
  asChild?: boolean;
  href: string;
  children: React.ReactNode;
  className?: string;
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
          className,
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
