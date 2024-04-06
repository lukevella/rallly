"use client";

import { Button } from "@rallly/ui/button";
import Link from "next/link";

import { CurrentUserAvatar } from "@/components/user";
import { useUser } from "@/components/user-provider";

export function UserMenu() {
  const { user } = useUser();
  return (
    <Button asChild className="pr-4">
      <Link href="/settings/profile">
        <CurrentUserAvatar size="xs" />
        <span className="grow truncate font-semibold">{user.name}</span>
      </Link>
    </Button>
  );
}
