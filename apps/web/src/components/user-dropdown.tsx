import {
  ChevronDown,
  LifeBuoyIcon,
  ListIcon,
  LogInIcon,
  LogOutIcon,
  RefreshCcwIcon,
  ScrollTextIcon,
  Settings2Icon,
  UserIcon,
  UserPlusIcon,
} from "@rallly/icons";
import { Button } from "@rallly/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@rallly/ui/dropdown-menu";
import Link from "next/link";

import { Trans } from "@/components/trans";
import { CurrentUserAvatar } from "@/components/user";

import { IfAuthenticated, IfGuest, useUser } from "./user-provider";

export const UserDropdown = () => {
  const { user } = useUser();
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild className="group">
        <Button className="rounded-full">
          <CurrentUserAvatar size="sm" className="-ml-1" />
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel className="flex items-center gap-2">
          <div className="grow">
            <div>{user.isGuest ? <Trans i18nKey="guest" /> : user.name}</div>
            <div className="text-muted-foreground text-xs font-normal">
              {!user.isGuest ? user.email : user.id.substring(0, 10)}
            </div>
          </div>
          <div className="ml-4">
            <span className="bg-foreground rounded-full px-1.5 py-0.5 text-xs text-white">
              <Trans i18nKey="planFree" defaults="Free" />
            </span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <IfAuthenticated>
          <DropdownMenuItem asChild={true}>
            <Link
              href="/settings/profile"
              className="flex items-center gap-x-2"
            >
              <UserIcon className="h-4 w-4" />
              <Trans i18nKey="profile" defaults="Profile" />
            </Link>
          </DropdownMenuItem>
        </IfAuthenticated>
        <DropdownMenuItem asChild={true}>
          <Link
            href="/settings/preferences"
            className="flex items-center gap-x-2"
          >
            <Settings2Icon className="h-4 w-4" />
            <Trans i18nKey="preferences" defaults="Preferences" />
          </Link>
        </DropdownMenuItem>
        {/* <DropdownMenuItem asChild={true}>
          <Link href="/settings/billing" className="flex items-center gap-x-2">
            <CreditCardIcon className="h-4 w-4" />
            <Trans i18nKey="Billing" defaults="Billing" />
          </Link>
        </DropdownMenuItem> */}
        <DropdownMenuItem asChild={true}>
          <Link href="/polls" className="flex items-center gap-x-2 sm:hidden">
            <ListIcon className="h-4 w-4" />
            <Trans i18nKey="polls" defaults="Polls" />
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild={true}>
          <Link
            target="_blank"
            href="https://support.rallly.co"
            className="flex items-center gap-x-2"
          >
            <LifeBuoyIcon className="h-4 w-4" />
            <Trans i18nKey="support" defaults="Support" />
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild={true}>
          <Link
            target="_blank"
            href="https://rallly.co/blog"
            className="flex items-center gap-x-2"
          >
            <ScrollTextIcon className="h-4 w-4" />
            <Trans i18nKey="changelog" defaults="Change log" />
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <IfGuest>
          <DropdownMenuItem asChild={true}>
            <Link href="/login" className="flex items-center gap-x-2">
              <LogInIcon className="h-4 w-4" />
              <Trans i18nKey="login" defaults="login" />
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild={true}>
            <Link href="/register" className="flex items-center gap-x-2">
              <UserPlusIcon className="h-4 w-4" />
              <Trans i18nKey="createAnAccount" defaults="Register" />
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild={true}>
            <Link href="/logout" className="flex items-center gap-x-2">
              <RefreshCcwIcon className="h-4 w-4" />
              <Trans i18nKey="forgetMe" />
            </Link>
          </DropdownMenuItem>
        </IfGuest>
        <IfAuthenticated>
          <DropdownMenuItem asChild={true}>
            <Link href="/logout" className="flex items-center gap-x-2">
              <LogOutIcon className="h-4 w-4" />
              <Trans i18nKey="logout" />
            </Link>
          </DropdownMenuItem>
        </IfAuthenticated>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
