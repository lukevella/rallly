"use client";
import { cn } from "@rallly/ui";
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
  ArrowUpRight,
  ChevronDownIcon,
  CreditCardIcon,
  GemIcon,
  LifeBuoyIcon,
  ListIcon,
  LogInIcon,
  LogOutIcon,
  MegaphoneIcon,
  Settings2Icon,
  UserIcon,
  UserPlusIcon,
} from "lucide-react";
import Link from "next/link";

import { LoginLink } from "@/components/login-link";
import { OptimizedAvatarImage } from "@/components/optimized-avatar-image";
import { RegisterLink } from "@/components/register-link";
import { Trans } from "@/components/trans";
import { IfCloudHosted, IfSelfHosted } from "@/contexts/environment";
import { isFeedbackEnabled } from "@/utils/constants";

import { IfAuthenticated, IfGuest, useUser } from "./user-provider";

export const UserDropdown = ({ className }: { className?: string }) => {
  const { user, logout } = useUser();
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger
        data-testid="user-dropdown"
        asChild
        className={cn("group min-w-0", className)}
      >
        <Button variant="ghost">
          <OptimizedAvatarImage
            src={user.image ?? undefined}
            name={user.name}
            size="sm"
          />
          <span className="truncate">{user.name}</span>
          <Icon>
            <ChevronDownIcon />
          </Icon>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel className="flex items-center gap-2">
          <div className="grow">
            <div>{user.isGuest ? <Trans i18nKey="guest" /> : user.name}</div>
            {user.email ? (
              <div className="font-normal text-muted-foreground text-xs">
                {user.email}
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
        <IfAuthenticated>
          <DropdownMenuItem asChild={true}>
            <Link
              href="/settings/profile"
              className="flex items-center gap-x-2"
            >
              <UserIcon className="size-4 text-muted-foreground" />
              <Trans i18nKey="profile" defaults="Profile" />
            </Link>
          </DropdownMenuItem>
        </IfAuthenticated>
        <DropdownMenuItem asChild={true}>
          <Link
            href="/settings/preferences"
            className="flex items-center gap-x-2"
          >
            <Settings2Icon className="size-4 text-muted-foreground" />
            <Trans i18nKey="preferences" defaults="Preferences" />
          </Link>
        </DropdownMenuItem>
        <IfCloudHosted>
          <DropdownMenuItem asChild={true}>
            <Link
              href="/settings/billing"
              className="flex items-center gap-x-2"
            >
              <CreditCardIcon className="size-4 text-muted-foreground" />
              <Trans i18nKey="Billing" defaults="Billing" />
            </Link>
          </DropdownMenuItem>
        </IfCloudHosted>
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
        <IfSelfHosted>
          <DropdownMenuItem asChild={true}>
            <Link
              target="_blank"
              href="https://support.rallly.co/self-hosting/pricing"
              className="flex items-center gap-x-2"
            >
              <GemIcon className="size-4 text-muted-foreground" />
              <Trans i18nKey="pricing" defaults="Pricing" />
            </Link>
          </DropdownMenuItem>
        </IfSelfHosted>
        {isFeedbackEnabled ? (
          <DropdownMenuItem asChild={true}>
            <Link
              target="_blank"
              href="https://feedback.rallly.co"
              className="flex items-center gap-x-2"
            >
              <MegaphoneIcon className="size-4 text-muted-foreground" />
              <Trans i18nKey="feedback" defaults="Feedback" />
            </Link>
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuSeparator />
        <IfGuest>
          <DropdownMenuItem asChild={true}>
            <LoginLink className="flex items-center gap-x-2">
              <LogInIcon className="size-4 text-muted-foreground" />
              <Trans i18nKey="login" defaults="login" />
            </LoginLink>
          </DropdownMenuItem>
          <DropdownMenuItem asChild={true}>
            <RegisterLink className="flex items-center gap-x-2">
              <UserPlusIcon className="size-4 text-muted-foreground" />
              <Trans i18nKey="createAnAccount" defaults="Register" />
            </RegisterLink>
          </DropdownMenuItem>
        </IfGuest>
        <IfAuthenticated>
          <DropdownMenuItem
            onClick={() => {
              logout();
            }}
            className="flex items-center gap-x-2"
          >
            <LogOutIcon className="size-4 text-muted-foreground" />
            <Trans i18nKey="logout" />
          </DropdownMenuItem>
        </IfAuthenticated>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
