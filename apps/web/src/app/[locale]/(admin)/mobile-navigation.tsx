"use client";

import { Button } from "@rallly/ui/button";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { MobileMenuButton } from "@/app/[locale]/(admin)/menu/menu-button";
import { CurrentUserAvatar } from "@/components/user";

export function MobileNavigation() {
  const pathname = usePathname();

  const isOpen = pathname === "/menu";

  return (
    <div className="sticky top-0 z-20 flex h-12 items-center justify-between border-b bg-gray-100 px-2 lg:hidden lg:px-4">
      <MobileMenuButton open={isOpen} />
      <div className="flex justify-end gap-x-2.5">
        <Button asChild variant="ghost">
          <Link href="/settings/profile">
            <CurrentUserAvatar size="xs" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
