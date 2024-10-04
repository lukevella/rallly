"use client";
import { cn } from "@rallly/ui";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

export function TabMenuItem({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  return (
    <li>
      <Link
        className={cn(
          "flex h-9 min-w-0 grow items-center gap-x-2.5 rounded-md px-2.5 text-sm font-medium",
          pathname === href
            ? "text-foreground bg-gray-100"
            : "hover:text-foreground focus:text-foreground border-transparent text-gray-500 hover:bg-gray-100 focus:bg-gray-200",
        )}
        href={href}
      >
        {children}
      </Link>
    </li>
  );
}

export function TabMenu({ children }: { children: React.ReactNode }) {
  return (
    <ul className="scrollbar-none flex gap-1 overflow-auto">{children}</ul>
  );
}
