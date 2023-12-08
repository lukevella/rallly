"use client";
import { cn } from "@rallly/ui";
import { Button } from "@rallly/ui/button";
import {
  BlocksIcon,
  BookMarkedIcon,
  CalendarIcon,
  CheckCircle2Icon,
  CreditCardIcon,
  LogInIcon,
  MenuIcon,
  Settings2Icon,
  SparklesIcon,
  UserIcon,
  UsersIcon,
  VoteIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import React from "react";
import { Trans } from "react-i18next/TransWithoutContext";
import { useToggle } from "react-use";

import { ProBadge } from "@/components/pro-badge";
import { UserDropdown } from "@/components/user-dropdown";
import { IfAuthenticated, IfGuest } from "@/components/user-provider";
import { IfFreeUser, IfSubscribed } from "@/contexts/plan";
import { IconComponent } from "@/types";
import { isSelfHosted } from "@/utils/constants";

const Auth = ({ children }: { children: React.ReactNode }) => {
  const session = useSession();
  const isAuthenticated = !!session.data?.user.email;

  React.useEffect(() => {
    if (!isAuthenticated) {
      signIn();
    }
  }, [isAuthenticated]);

  if (isAuthenticated) {
    return <>{children}</>;
  }

  return null;
};

function MenuItem({
  href,
  children,
  icon: Icon,
  current,
}: {
  href: string;
  icon: IconComponent;
  children: React.ReactNode;
  current?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        current
          ? "bg-gray-200 text-gray-800"
          : "text-gray-700 hover:bg-gray-200 active:bg-gray-300",
        "group flex  items-center gap-x-3 rounded-md py-2 px-3 text-sm leading-6 font-semibold",
      )}
    >
      <Icon
        className={cn(
          current ? "text-gray-500" : "text-gray-400 group-hover:text-gray-500",
          "h-5 w-5 shrink-0",
        )}
        aria-hidden="true"
      />
      {children}
    </Link>
  );
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, toggleMenu] = useToggle(false);

  React.useEffect(() => {
    toggleMenu(false);
  }, [pathname, toggleMenu]);

  if (isSelfHosted) {
    return <Auth>{children}</Auth>;
  }
  return (
    <div className="lg:flex h-full bg-gray-50">
      <div
        className={cn(
          "lg:flex lg:w-72 bg-gray-100 shrink-0 flex-col gap-y-5 overflow-y-auto border-r lg:px-6 lg:py-5 px-5 py-3",
          open ? "block" : "hidden",
        )}
      >
        <div className="mb-2">
          <Link href="/" className="active:translate-y-1 transition-transform">
            <Image alt="Rallly" src="/logo-mark.svg" width={32} height={32} />
          </Link>
        </div>
        <nav className="flex flex-1 flex-col">
          <ul role="list" className="flex flex-1 flex-col gap-y-7">
            <li>
              <ul role="list" className="-mx-2 space-y-1">
                <li>
                  <MenuItem
                    current={pathname?.startsWith("/poll")}
                    href="/polls"
                    icon={VoteIcon}
                  >
                    <Trans i18nKey="polls" defaults="Polls" />
                  </MenuItem>
                </li>
              </ul>
            </li>
            <li>
              <div className="text-xs font-semibold leading-6 text-gray-400">
                <Trans i18nKey="comingSoon" defaults="Coming Soon" />
              </div>
              <ul role="list" className="-mx-2 mt-2 space-y-1">
                <li className="grid gap-1 pointer-events-none opacity-50">
                  <MenuItem href="/b" icon={CalendarIcon}>
                    <Trans i18nKey="calendar" defaults="Calendar" />
                  </MenuItem>
                  <MenuItem href="/b" icon={BookMarkedIcon}>
                    <Trans i18nKey="registeration" defaults="Registrations" />
                  </MenuItem>
                  <MenuItem href="/rsvp" icon={CheckCircle2Icon}>
                    <Trans i18nKey="rspvs" defaults="RSVPs" />
                  </MenuItem>
                  <MenuItem href="/contacts" icon={BlocksIcon}>
                    <Trans i18nKey="integrations" defaults="Integrations" />
                  </MenuItem>
                  <MenuItem href="/contacts" icon={UsersIcon}>
                    <Trans i18nKey="contacts" defaults="Contacts" />
                  </MenuItem>
                </li>
              </ul>
            </li>
            <li className="mt-auto">
              <ul role="list" className="-mx-2 space-y-1">
                <IfFreeUser>
                  <li>
                    <Link
                      href="/settings/billing"
                      className="border rounded-md mb-4 px-4 py-3 bg-gray-50/50 hover:bg-gray-200 active:bg-gray-300 border-gray-200 hover:border-gray-300 grid"
                    >
                      <span className="flex mb-2 items-center gap-x-2">
                        <SparklesIcon className="h-5 text-gray-400 w-5" />
                        <span className="font-bold text-sm">
                          <Trans i18nKey="upgrade" />
                        </span>
                        <ProBadge />
                      </span>
                      <span className="text-gray-500 leading-relaxed text-sm">
                        <Trans
                          i18nKey="unlockFeatures"
                          defaults="Unlock all Pro features."
                        />
                      </span>
                    </Link>
                  </li>
                </IfFreeUser>
                <IfSubscribed>
                  <MenuItem href="/settings/billing" icon={CreditCardIcon}>
                    <Trans i18nKey="billing" defaults="Billing" />
                  </MenuItem>
                </IfSubscribed>
                <IfAuthenticated>
                  <MenuItem href="/settings/profile" icon={UserIcon}>
                    <Trans i18nKey="profile" defaults="Profile" />
                  </MenuItem>
                </IfAuthenticated>
                <IfGuest>
                  <li>
                    <MenuItem href="/login" icon={LogInIcon}>
                      <Trans i18nKey="login" />
                    </MenuItem>
                  </li>
                </IfGuest>
                <li>
                  <MenuItem href="/settings/preferences" icon={Settings2Icon}>
                    <Trans i18nKey="preferences" />
                  </MenuItem>
                </li>
              </ul>
            </li>
          </ul>
        </nav>
      </div>
      <div className={cn("grow overflow-auto bg-gray-50")}>{children}</div>
    </div>
  );
}
