import {
  ChevronDown,
  CreditCardIcon,
  GemIcon,
  LifeBuoyIcon,
  ListIcon,
  LogInIcon,
  LogOutIcon,
  MegaphoneIcon,
  RefreshCcwIcon,
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
import { IfCloudHosted, IfSelfHosted } from "@/contexts/environment";
import { Plan } from "@/contexts/plan";
import { isFeedbackEnabled } from "@/utils/constants";

import { IfAuthenticated, IfGuest, useUser } from "./user-provider";

export const UserDropdown = () => {
  const { user } = useUser();
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild className="group">
        <Button variant="ghost" className="rounded-full">
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
            <Plan />
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild={true}>
          <Link href="/polls" className="flex items-center gap-x-2 sm:hidden">
            <ListIcon className="h-4 w-4" />
            <Trans i18nKey="polls" defaults="Polls" />
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild={true}>
          <Link href="/settings/profile" className="flex items-center gap-x-2">
            <UserIcon className="h-4 w-4" />
            <Trans i18nKey="profile" defaults="Profile" />
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild={true}>
          <Link
            href="/settings/preferences"
            className="flex items-center gap-x-2"
          >
            <Settings2Icon className="h-4 w-4" />
            <Trans i18nKey="preferences" defaults="Preferences" />
          </Link>
        </DropdownMenuItem>
        <IfCloudHosted>
          <DropdownMenuItem asChild={true}>
            <Link
              href="/settings/billing"
              className="flex items-center gap-x-2"
            >
              <CreditCardIcon className="h-4 w-4" />
              <Trans i18nKey="Billing" defaults="Billing" />
            </Link>
          </DropdownMenuItem>
        </IfCloudHosted>
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
        <IfSelfHosted>
          <DropdownMenuItem asChild={true}>
            <Link
              target="_blank"
              href="https://support.rallly.co/self-hosting/pricing"
              className="flex items-center gap-x-2"
            >
              <GemIcon className="h-4 w-4" />
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
              <MegaphoneIcon className="h-4 w-4" />
              <Trans i18nKey="feedback" defaults="Feedback" />
            </Link>
          </DropdownMenuItem>
        ) : null}
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
