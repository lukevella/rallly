"use client";
import { usePostHog } from "@rallly/posthog/client";
import { cn } from "@rallly/ui";
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
  ArrowUpRight,
  ChevronDownIcon,
  LifeBuoyIcon,
  ListIcon,
  LogOutIcon,
  MonitorIcon,
  MoonIcon,
  Settings2Icon,
  SunIcon,
  SunMoonIcon,
  UserIcon,
} from "lucide-react";
import Link from "next/link";
import { OptimizedAvatarImage } from "@/components/optimized-avatar-image";
import { Trans } from "@/i18n/client";
import { useTheme } from "@/features/theme/client";
import { signOut } from "@/lib/auth-client";

export const UserDropdown = ({
  name,
  image,
  email,
  className,
}: {
  name: string;
  image?: string;
  email?: string;
  className?: string;
}) => {
  const posthog = usePostHog();
  const { theme, setTheme } = useTheme();

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger
        data-testid="user-dropdown"
        asChild
        className={cn("group min-w-0", className)}
      >
        <Button variant="ghost">
          <OptimizedAvatarImage src={image} name={name} size="sm" />
          <span className="truncate">{name}</span>
          <Icon>
            <ChevronDownIcon />
          </Icon>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel className="flex items-center gap-2">
          <div className="grow">
            <div className="font-medium text-foreground text-sm">{name}</div>
            {email ? (
              <div className="font-normal text-muted-foreground text-xs">
                {email}
              </div>
            ) : null}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild={true}>
          <Link href="/polls" className="flex items-center gap-x-2 sm:hidden">
            <ListIcon className="size-4 text-muted-foreground" />
            <Trans i18nKey="polls" defaults="Polls" />
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild={true}>
          <Link href="/settings/profile" className="flex items-center gap-x-2">
            <UserIcon className="size-4 text-muted-foreground" />
            <Trans i18nKey="profile" defaults="Profile" />
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild={true}>
          <Link
            href="/settings/preferences"
            className="flex items-center gap-x-2"
          >
            <Settings2Icon className="size-4 text-muted-foreground" />
            <Trans i18nKey="preferences" defaults="Preferences" />
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild={true}>
          <Link
            target="_blank"
            href="https://support.rallly.co"
            className="flex items-center gap-x-2"
          >
            <LifeBuoyIcon className="size-4 text-muted-foreground" />
            <Trans i18nKey="support" defaults="Support" />
            <Icon>
              <ArrowUpRight />
            </Icon>
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
            await signOut();
            posthog?.reset();
          }}
          className="flex items-center gap-x-2"
        >
          <LogOutIcon className="size-4 text-muted-foreground" />
          <Trans i18nKey="logout" />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
