"use client";

import { Button } from "@rallly/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@rallly/ui/dropdown-menu";
import { Icon } from "@rallly/ui/icon";
import {
  ChevronDownIcon,
  LogOutIcon,
  MonitorIcon,
  MoonIcon,
  Settings2Icon,
  SunIcon,
  SunMoonIcon,
  UserIcon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React from "react";
import { OptimizedAvatarImage } from "@/components/optimized-avatar-image";
import { RouterLoadingIndicator } from "@/components/router-loading-indicator";
import { useUser } from "@/features/user/components/user-provider";
import { Trans } from "@/i18n/client";
import { signOut } from "@/lib/auth-client";
import { useTheme } from "@/lib/theme";

export function NavUser() {
  const { user } = useUser();
  const [isPending, setIsPending] = React.useState(false);
  const { theme, setTheme } = useTheme();
  const router = useRouter();

  if (!user) {
    return null;
  }

  return (
    <>
      {isPending && <RouterLoadingIndicator />}
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button className="flex h-auto w-full gap-2 p-2" variant="ghost" />
          }
        >
          <OptimizedAvatarImage size="lg" src={user.image} name={user.name} />
          <div className="flex-1 truncate text-left">
            <div className="font-medium">{user.name}</div>
            <div className="mt-0.5 truncate font-normal text-muted-foreground text-xs">
              {user.email}
            </div>
          </div>
          <Icon>
            <ChevronDownIcon />
          </Icon>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className="w-(--anchor-width)"
          align="end"
          side="top"
        >
          <DropdownMenuLabel>
            <Trans i18nKey="account" defaults="Account" />
          </DropdownMenuLabel>
          <DropdownMenuItem render={<Link href="/settings/profile" />}>
            <Icon>
              <UserIcon />
            </Icon>
            <Trans i18nKey="profile" defaults="Profile" />
          </DropdownMenuItem>
          <DropdownMenuItem render={<Link href="/settings/preferences" />}>
            <Icon>
              <Settings2Icon />
            </Icon>
            <Trans i18nKey="preferences" defaults="Preferences" />
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <Icon>
                <SunMoonIcon />
              </Icon>
              <Trans i18nKey="theme" defaults="Theme" />
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuRadioGroup value={theme} onValueChange={setTheme}>
                <DropdownMenuRadioItem value="system">
                  <Icon>
                    <MonitorIcon />
                  </Icon>
                  <Trans i18nKey="themeSystem" defaults="System" />
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="light">
                  <Icon>
                    <SunIcon />
                  </Icon>
                  <Trans i18nKey="themeLight" defaults="Light" />
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="dark">
                  <Icon>
                    <MoonIcon />
                  </Icon>
                  <Trans i18nKey="themeDark" defaults="Dark" />
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={async () => {
              setIsPending(true);
              try {
                await signOut();
                router.refresh();
              } finally {
                setIsPending(false);
              }
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
