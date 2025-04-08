"use client";

import { Button } from "@rallly/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@rallly/ui/dropdown-menu";
import { Icon } from "@rallly/ui/icon";
import {
  ChevronsUpDownIcon,
  CreditCardIcon,
  LogOutIcon,
  Settings2Icon,
  UserIcon,
} from "lucide-react";
import Link from "next/link";
import { signOut } from "next-auth/react";

import { OptimizedAvatarImage } from "@/components/optimized-avatar-image";
import { Trans } from "@/components/trans";

export function UserDropdown({
  name,
  image,
  email,
}: {
  name: string;
  image?: string;
  email: string;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex w-full items-center gap-3 rounded-md p-2 text-sm hover:bg-gray-200 data-[state=open]:bg-gray-200">
        <OptimizedAvatarImage size="md" src={image ?? undefined} name={name} />
        <div className="flex-1 truncate text-left">
          <div>{name}</div>
          <div className="text-muted-foreground truncate text-sm font-normal">
            {email}
          </div>
        </div>
        <Icon>
          <ChevronsUpDownIcon />
        </Icon>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="right" align="end">
        <DropdownMenuItem asChild>
          <Link href="/settings/profile">
            <Icon>
              <UserIcon />
            </Icon>
            <Trans i18nKey="profile" defaults="Profile" />
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/settings/preferences">
            <Icon>
              <Settings2Icon />
            </Icon>
            <Trans i18nKey="preferences" defaults="Preferences" />
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/settings/billing">
            <Icon>
              <CreditCardIcon />
            </Icon>
            <Trans i18nKey="billing" defaults="Billing" />
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => {
            signOut();
          }}
        >
          <Icon>
            <LogOutIcon />
          </Icon>
          <Trans i18nKey="logout" defaults="Logout" />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
