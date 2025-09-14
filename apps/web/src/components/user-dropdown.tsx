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
  LogOutIcon,
  Settings2Icon,
  UserIcon,
} from "lucide-react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { OptimizedAvatarImage } from "@/components/optimized-avatar-image";
import { Trans } from "@/components/trans";
import { IfCloudHosted, IfSelfHosted } from "@/contexts/environment";
import { useAuthenticatedUser } from "./user-provider";

export const UserDropdown = ({ className }: { className?: string }) => {
  const { user } = useAuthenticatedUser();
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
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={async () => {
            await signOut();
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
