"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { MobileMenuButton } from "@/app/[locale]/(admin)/menu/menu-button";
import { Sidebar } from "@/app/[locale]/(admin)/sidebar";
import { CurrentUserAvatar } from "@/components/user";

export function MobileNavigation() {
  const pathname = usePathname();

  const isOpen = pathname === "/menu";

  return (
    <div>
      <div className="flex h-12 items-center justify-between border-b bg-gray-100 px-3 lg:hidden lg:px-4">
        <MobileMenuButton open={isOpen} />
        <div className="flex justify-end gap-x-2.5">
          <Link
            href="/settings/profile"
            className="inline-flex h-9 w-7 items-center"
          >
            <CurrentUserAvatar size="sm" />
          </Link>
        </div>
      </div>
      {isOpen ? (
        <div className="p-4">
          <Sidebar />
        </div>
      ) : null}
    </div>
  );
}
