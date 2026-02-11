"use client";

import { usePostHog } from "@rallly/posthog/client";
import { Button } from "@rallly/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
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
import React from "react";
import { OptimizedAvatarImage } from "@/components/optimized-avatar-image";
import { RouterLoadingIndicator } from "@/components/router-loading-indicator";
import { Trans } from "@/i18n/client";
import { useTheme } from "@/features/theme/client";
import { signOut } from "@/lib/auth-client";

export function NavUser({
  name,
  image,
  email,
}: {
  name: string;
  image?: string;
  email: string;
}) {
  const [isPending, setIsPending] = React.useState(false);
  const posthog = usePostHog();
  const { theme, setTheme } = useTheme();
  return (
    <>
      {isPending && <RouterLoadingIndicator />}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button className="flex h-auto w-full gap-2 p-2" variant="ghost">
            <OptimizedAvatarImage size="md" src={image} name={name} />
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
        <DropdownMenuContent
          className="w-(--radix-dropdown-menu-trigger-width)"
          align="end"
          side="top"
        >
          <DropdownMenuLabel>
            <Trans i18nKey="account" defaults="Account" />
          </DropdownMenuLabel>
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
          <DropdownMenuSeparator />
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <Icon>
                <SunMoonIcon />
              </Icon>
              <Trans i18nKey="theme" defaults="Theme" />
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
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
            </DropdownMenuPortal>
          </DropdownMenuSub>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={async () => {
              setIsPending(true);
              await signOut();
              posthog?.reset();
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
