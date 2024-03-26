"use client";

import { Button } from "@rallly/ui/button";
import { ChevronRightIcon } from "lucide-react";
import Link from "next/link";

import { CurrentUserAvatar } from "@/components/user";
import { useUser } from "@/components/user-provider";

export function UserMenu() {
  const { user } = useUser();
  return (
    <Button
      asChild
      variant="ghost"
      className="group h-auto w-full justify-start py-3"
    >
      <Link href="/settings/profile">
        <CurrentUserAvatar />
        <span className="ml-1 grid grow">
          <span className="font-semibold">{user.name}</span>
          <span className="text-muted-foreground text-sm">{user.email}</span>
        </span>
        <ChevronRightIcon className="text-muted-foreground size-4 opacity-0 group-hover:opacity-100" />
      </Link>
    </Button>
  );
}
