"use client";

import { Button } from "@rallly/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@rallly/ui/dropdown-menu";
import { Icon } from "@rallly/ui/icon";
import {
  ChevronDownIcon,
  LayersIcon,
  LogOutIcon,
  SettingsIcon,
  UserIcon,
} from "lucide-react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import React from "react";
import { OptimizedAvatarImage } from "@/components/optimized-avatar-image";
import { RouterLoadingIndicator } from "@/components/router-loading-indicator";
import { Trans } from "@/components/trans";

export function NavUser({
  name,
  image,
  email,
}: {
  name: string;
  image?: string;
  email: string;
}) {
  const [isPending, startTransition] = React.useTransition();

  return (
    <>
      {isPending && <RouterLoadingIndicator />}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button className="flex h-auto w-full p-2" variant="ghost">
            <OptimizedAvatarImage size="lg" src={image} name={name} />
            <div className="flex-1 truncate text-left">
              <div className="font-medium">{name}</div>
              <div className="mt-0.5 truncate font-normal text-muted-foreground text-xs">
                {email}
              </div>
            </div>
            <Icon>
              <ChevronDownIcon />
            </Icon>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" side="top">
          <DropdownMenuItem asChild>
            <Link href="/account/profile">
              <Icon>
                <UserIcon />
              </Icon>
              <Trans i18nKey="profile" defaults="Profile" />
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/account/preferences">
              <Icon>
                <SettingsIcon />
              </Icon>
              <Trans i18nKey="preferences" defaults="Preferences" />
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/account/spaces">
              <Icon>
                <LayersIcon />
              </Icon>
              <Trans i18nKey="spaces" defaults="Spaces" />
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => {
              startTransition(async () => {
                await signOut({
                  redirectTo: "/",
                });
              });
            }}
          >
            <Icon>
              <LogOutIcon />
            </Icon>
            <Trans i18nKey="signOut" defaults="Sign Out" />
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
