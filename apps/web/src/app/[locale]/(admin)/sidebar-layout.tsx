"use client";

import { cn } from "@rallly/ui";
import { Button } from "@rallly/ui/button";
import { Flex } from "@rallly/ui/flex";
import { Icon } from "@rallly/ui/icon";
import { MenuIcon, Settings2Icon, XIcon } from "lucide-react";
import Link from "next/link";
import React from "react";

import { CurrentUserAvatar } from "@/components/user";

export function MainLayout({ children }: { children?: React.ReactNode }) {
  return (
    <div className="flex flex-col bg-gray-100 lg:flex-row">{children}</div>
  );
}

export function MainNavigation({ children }: { children?: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  return (
    <div
      className={cn(
        "top-0 flex shrink-0 flex-col lg:sticky lg:h-screen lg:w-72",
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

export function MainContent({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("min-h-screen grow space-y-6 p-6", className)}>
      {children}
    </div>
  );
}
