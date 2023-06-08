import {
  ChevronDown,
  LifeBuoyIcon,
  LogInIcon,
  LogOutIcon,
  RefreshCcwIcon,
  ScrollTextIcon,
  Settings2Icon,
  UserIcon,
  UserPlusIcon,
} from "@rallly/icons";
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
import clsx from "clsx";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import React from "react";
import { Toaster } from "react-hot-toast";

import { LoginModalProvider } from "@/components/auth/login-modal";
import { Container } from "@/components/container";
import { Spinner } from "@/components/spinner";
import { Trans } from "@/components/trans";
import { CurrentUserAvatar } from "@/components/user";

import { NextPageWithLayout } from "../../types";
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
      <DropdownMenuTrigger asChild className="group">
        <Button className="rounded-full shadow-none">
          <CurrentUserAvatar size="sm" className="-ml-1" />
          <span className="text-sm font-medium">
            {user.isGuest ? <Trans i18nKey="guest" /> : user.name}
          </span>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>
          <Trans i18nKey="myAccount" defaults="My Account" />
        </DropdownMenuLabel>
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
            href="https://github.com/lukevella/rallly/releases"
            className="flex items-center gap-x-2"
          >
            <ScrollTextIcon className="h-4 w-4" />
            <Trans i18nKey="changelog" defaults="Change log" />
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild={true}>
          <Link
            href="/settings/preferences"
            className="flex items-center gap-x-2"
          >
            <Settings2Icon className="h-4 w-4" />
            <Trans i18nKey="preferences" defaults="Preferences" />
          </Link>
        </DropdownMenuItem>
        <IfGuest>
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
const NavMenuItem = ({
  href,
  target,
  label,
}: {
  href: string;
  target?: string;
  label: React.ReactNode;
}) => {
  const router = useRouter();
  return (
    <Link
      target={target}
      href={href}
      className={cn(
        "flex items-center gap-2 rounded-none px-4 py-1.5 text-sm font-medium",
        router.asPath === href
          ? "text-foreground"
          : "text-muted-foreground hover:text-foreground active:bg-gray-200/50",
      )}
    >
      {label}
    </Link>
  );
};

const Logo = () => {
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
    <div className="flex items-center justify-center gap-4">
      <Link
        href="/polls"
        className={clsx(
          "inline-block transition-all hover:opacity-75 active:translate-y-1",
        )}
      >
        <Image
          className="hidden sm:block"
          src="/logo.svg"
          width={120}
          height={22}
          alt="Rallly"
        />
        <Image
          className="sm:hidden"
          src="/logo-mark.svg"
          width={30}
          height={30}
          alt="Rallly"
        />
      </Link>
      <div className="flex h-9 w-9 items-center justify-center">
        {isBusy ? <Spinner className="text-gray-500" /> : null}
      </div>
    </div>
  );
};

const MainNav = () => {
  return (
    <div className="border-b bg-gray-50">
      <Container className="flex h-14 items-center justify-between sm:justify-start">
        <div className="flex shrink-0 gap-4">
          <Logo />
        </div>
        <div className="hidden h-full grow sm:flex">
          <nav className="flex">
            <NavMenuItem
              href="/polls"
              label={<Trans i18nKey="polls" defaults="Polls" />}
            />
            <NavMenuItem
              href="/settings/preferences"
              label={<Trans i18nKey="preferences" defaults="Preferences" />}
            />
          </nav>
        </div>
        <div className="flex gap-2">
          <IfGuest>
            <Button asChild>
              <Link href="/login">
                <LogInIcon className="-ml-0.5 h-4 w-4" />
                <Trans i18nKey="login" />
              </Link>
            </Button>
          </IfGuest>
          <UserDropdown />
        </div>
      </Container>
    </div>
  );
};

export const StandardLayout: React.FunctionComponent<{
  children?: React.ReactNode;
}> = ({ children, ...rest }) => {
  return (
    <UserProvider>
      <Toaster />
      <ModalProvider>
        <LoginModalProvider>
          <div className="flex min-h-screen flex-col" {...rest}>
            <MainNav />
            <div>{children}</div>
          </div>
        </LoginModalProvider>
      </ModalProvider>
    </UserProvider>
  );
};

export const getStandardLayout: NextPageWithLayout["getLayout"] =
  function getLayout(page) {
    return <StandardLayout>{page}</StandardLayout>;
  };
