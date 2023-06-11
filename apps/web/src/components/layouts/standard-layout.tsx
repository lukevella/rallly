import { ListIcon, LogInIcon, Settings2Icon } from "@rallly/icons";
import { cn } from "@rallly/ui";
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
import { UserDropdown } from "@/components/user-dropdown";

import { IconComponent, NextPageWithLayout } from "../../types";
import ModalProvider from "../modal/modal-provider";
import { IfGuest, UserProvider } from "../user-provider";

const NavMenuItem = ({
  href,
  target,
  label,
  icon: Icon,
}: {
  icon: IconComponent;
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
        "flex items-center gap-2.5 px-2.5 py-1.5 text-sm font-medium",
        router.asPath === href
          ? "text-foreground"
          : "text-muted-foreground hover:text-foreground active:bg-gray-200/50",
      )}
    >
      <Icon className="h-4 w-4" />
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
    <div className="relative flex items-center justify-center gap-4 pr-10">
      <Link
        href="/polls"
        className={clsx(
          "inline-block transition-transform active:translate-y-1",
        )}
      >
        <Image
          className="hidden sm:block"
          src="/static/logo.svg"
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
      <div
        className={cn(
          "pointer-events-none absolute -right-0 flex items-center justify-center text-gray-500 transition-opacity delay-500",
          isBusy ? "opacity-100" : "opacity-0",
        )}
      >
        {isBusy ? <Spinner /> : null}
      </div>
    </div>
  );
};

const MainNav = () => {
  return (
    <div className="border-b bg-gray-50">
      <Container className="flex h-14 items-center justify-between gap-4">
        <div className="flex shrink-0 gap-4">
          <Logo />
        </div>
        <div className="flex gap-x-4">
          <nav className="hidden gap-x-2 sm:flex">
            <NavMenuItem
              icon={ListIcon}
              href="/polls"
              label={<Trans i18nKey="polls" defaults="Polls" />}
            />
            <NavMenuItem
              icon={Settings2Icon}
              href="/settings/preferences"
              label={<Trans i18nKey="preferences" defaults="Preferences" />}
            />
            <IfGuest>
              <NavMenuItem
                icon={LogInIcon}
                href="/login"
                label={<Trans i18nKey="login" defaults="Login" />}
              />
            </IfGuest>
          </nav>
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
