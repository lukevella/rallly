"use client";

import { ChevronRightIcon } from "lucide-react";

import { SidebarMenuLink } from "@/app/[locale]/(admin)/sidebar-menu";
import { ProBadge } from "@/components/pro-badge";
import { CurrentUserAvatar } from "@/components/user";
import { useUser } from "@/components/user-provider";
import { usePlan } from "@/contexts/plan";

export function UserMenu() {
  const { user } = useUser();
  const plan = usePlan();
  return (
    <SidebarMenuLink className="h-14" href="/settings/profile">
      <CurrentUserAvatar />
      <span className="grow truncate font-semibold">{user.name}</span>
      {plan === "paid" ? <ProBadge /> : null}
      <ChevronRightIcon className="text-muted-foreground size-4 opacity-0 group-hover:opacity-100 group-[.is-active]:opacity-100" />
    </SidebarMenuLink>
  );
}
