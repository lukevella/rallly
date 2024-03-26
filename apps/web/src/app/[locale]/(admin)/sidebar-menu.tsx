"use client";

import { Slot } from "@radix-ui/react-slot";
import { cn } from "@rallly/ui";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

export function SidebarMenu({ children }: { children?: React.ReactNode }) {
  return (
    <ul role="list" className="space-y-1">
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

export function Sidebar({
  className,
  children,
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <nav className={cn("flex flex-1 flex-col", className)}>
      <ul role="list" className="flex flex-1 flex-col gap-y-6">
        {children}
      </ul>
    </nav>
  );
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
            ? "bg-gray-200 text-gray-800"
            : "group text-gray-500 hover:bg-gray-200 hover:text-gray-800 active:bg-gray-300",
          "flex h-9 items-center gap-x-3 rounded-md px-3 text-sm font-semibold",
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
  return (
    <Slot className="group-[.is-active]:text-primary size-5 text-gray-400">
      {children}
    </Slot>
  );
}
