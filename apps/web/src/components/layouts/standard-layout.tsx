import {
  AdjustmentsIcon,
  ChartSquareBarIcon,
  LoginIcon,
  LogoutIcon,
  PlusCircleIcon,
  RefreshIcon,
  SupportIcon,
  UserIcon,
} from "@rallly/icons";
import clsx from "clsx";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import React from "react";
import { Toaster } from "react-hot-toast";

import { Spinner } from "@/components/spinner";
import { Trans } from "@/components/trans";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CurrentUserAvatar } from "@/components/user";

import { IconComponent, NextPageWithLayout } from "../../types";
import ModalProvider from "../modal/modal-provider";
import {
  IfAuthenticated,
  IfGuest,
  UserProvider,
  useUser,
} from "../user-provider";

const UserDropdown = () => {
  const { user } = useUser();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="group flex flex-col items-center gap-y-2">
        <CurrentUserAvatar />
        <span className="hidden text-xs font-semibold group-active:text-gray-900 md:block">
          {user.isGuest ? <Trans i18nKey="guest" /> : user.shortName}
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <IfAuthenticated>
          <DropdownMenuLabel>
            <Trans i18nKey="myAccount" defaults="My Account" />
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
        </IfAuthenticated>
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
        <IfGuest>
          <DropdownMenuItem asChild={true}>
            <Link href="/register" className="flex items-center gap-x-2">
              <PlusCircleIcon className="h-4 w-4" />
              <Trans i18nKey="createAnAccount" defaults="Create an Account" />
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild={true}>
            <Link href="/logout" className="flex items-center gap-x-2">
              <RefreshIcon className="h-4 w-4" />
              <Trans i18nKey="forgetMe" />
            </Link>
          </DropdownMenuItem>
        </IfGuest>
        <IfAuthenticated>
          <DropdownMenuItem asChild={true}>
            <Link href="/logout" className="flex items-center gap-x-2">
              <LogoutIcon className="h-4 w-4" />
              <Trans i18nKey="logout" />
            </Link>
          </DropdownMenuItem>
        </IfAuthenticated>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
const MenuItem = ({
  href,
  icon: Icon,
  target,
  label,
}: {
  href: string;
  icon: IconComponent;
  target?: string;
  label: React.ReactNode;
}) => {
  return (
    <Link
      target={target}
      href={href}
      className="group flex flex-col items-center gap-0.5 p-2 hover:text-slate-600"
    >
      <span
        className={clsx(
          "mb-1 inline-block",
          "md:group-hover:bg-primary-50 md:group-hover:border-primary-200 md:group-hover:text-primary-600 md:group-active:bg-primary-100 md:rounded-lg",
        )}
      >
        <Icon className="h-6" />
      </span>
      <span className="hidden text-xs group-active:text-gray-900 md:block">
        {label}
      </span>
    </Link>
  );
};

export const StandardLayout: React.FunctionComponent<{
  children?: React.ReactNode;
}> = ({ children, ...rest }) => {
  const router = useRouter();
  const [isBusy, setIsBusy] = React.useState(false);
  React.useEffect(() => {
    const setBusy = () => setIsBusy(true);
    const setNotBusy = () => setIsBusy(false);
    router.events.on("routeChangeStart", setBusy);
    router.events.on("routeChangeComplete", setNotBusy);
    return () => {
      router.events.off("routeChangeStart", setBusy);
      router.events.off("routeChangeComplete", setNotBusy);
    };
  }, [router.events]);

  return (
    <UserProvider>
      <Toaster />
      <ModalProvider>
        <div className="flex min-h-full flex-col md:flex-row" {...rest}>
          <div className="min-h-full shrink-0 border-b bg-gray-50 text-slate-500 md:w-24 md:border-b-0 md:border-r lg:block">
            <div className="sticky top-0 flex h-full max-h-[calc(100vh)] items-center justify-between gap-y-8 gap-x-3 p-3 md:flex-col md:pt-3 md:pb-6">
              <div className="m-1 flex h-8 w-8 shrink-0 items-center justify-center">
                {isBusy ? (
                  <Spinner className="text-gray-500" />
                ) : (
                  <Link
                    href="/polls"
                    className={clsx(
                      "inline-block transition-all hover:opacity-75 active:translate-y-1",
                    )}
                  >
                    <Image
                      src="/favicon-32x32.png"
                      width={32}
                      height={32}
                      alt="Rallly"
                    />
                  </Link>
                )}
              </div>
              <div className="flex items-center gap-6 md:grow md:flex-col">
                <MenuItem
                  href="/polls"
                  icon={ChartSquareBarIcon}
                  label={<Trans i18nKey="polls" defaults="Polls" />}
                />
              </div>
              <MenuItem
                icon={SupportIcon}
                label={<Trans i18nKey="common_support" />}
                target="_blank"
                href="https://support.rallly.co"
              />
              <MenuItem
                href="/settings/preferences"
                icon={AdjustmentsIcon}
                label={<Trans i18nKey="preferences" />}
              />
              <IfGuest>
                <MenuItem
                  href="/login"
                  icon={LoginIcon}
                  label={<Trans i18nKey="login" />}
                />
              </IfGuest>
              <UserDropdown />
            </div>
          </div>
          <div className="flex min-w-0 max-w-full grow flex-col">
            {children}
          </div>
        </div>
      </ModalProvider>
    </UserProvider>
  );
};

export const getStandardLayout: NextPageWithLayout["getLayout"] =
  function getLayout(page) {
    return <StandardLayout>{page}</StandardLayout>;
  };
