"use client";
import { cn } from "@rallly/ui";
import { Button } from "@rallly/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@rallly/ui/select";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import React from "react";

import { useBreakpoint } from "@/utils/breakpoint";

const ResponsiveMenuContext = React.createContext<"desktop" | "mobile">(
  "desktop",
);

function DesktopMenuItem({
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
          "flex h-9 min-w-0 grow items-center gap-x-2.5 rounded-md border px-2.5 text-sm font-medium",
          pathname === href
            ? "bg-gray-50"
            : "text-gray-500 hover:bg-gray-100 active:bg-gray-200",
        )}
        href={href}
      >
        {children}
      </Link>
    </li>
  );
}

function MobileMenuItem({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <SelectItem value={href}>
      <div className="flex items-center gap-x-2">{children}</div>
    </SelectItem>
  );
}

export function ResponsiveMenuItem(props: {
  href: string;
  children: React.ReactNode;
}) {
  const breakpoint = React.useContext(ResponsiveMenuContext);

  switch (breakpoint) {
    case "desktop":
      return <DesktopMenuItem {...props} />;
    case "mobile":
      return <MobileMenuItem {...props} />;
  }
}

function DesktopMenu({ children }: { children: React.ReactNode }) {
  return (
    <ResponsiveMenuContext.Provider value="desktop">
      <ul className="inline-flex gap-2.5">{children}</ul>
    </ResponsiveMenuContext.Provider>
  );
}

function MobileMenu({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  if (!pathname) {
    return null;
  }

  return (
    <ResponsiveMenuContext.Provider value="mobile">
      <Select
        value={pathname}
        onValueChange={(destination) => {
          router.push(destination);
        }}
      >
        <SelectTrigger asChild className="w-full">
          <Button>
            <SelectValue />
          </Button>
        </SelectTrigger>
        <SelectContent>{children}</SelectContent>
      </Select>
    </ResponsiveMenuContext.Provider>
  );
}

export function ResponsiveMenu({ children }: { children?: React.ReactNode }) {
  const breakpoint = useBreakpoint();

  switch (breakpoint) {
    case "desktop":
      return <DesktopMenu>{children}</DesktopMenu>;
    case "mobile":
      return <MobileMenu>{children}</MobileMenu>;
  }
}
