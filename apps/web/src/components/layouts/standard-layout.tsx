import { ListIcon, SparklesIcon } from "@rallly/icons";
import { cn } from "@rallly/ui";
import { Button } from "@rallly/ui/button";
import clsx from "clsx";
import { AnimatePresence, m } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/router";
import React from "react";
import { Toaster } from "react-hot-toast";

import { Clock, ClockPreferences } from "@/components/clock";
import { Container } from "@/components/container";
import {
  FeaturebaseChangelog,
  FeaturebaseIdentify,
} from "@/components/featurebase";
import FeedbackButton from "@/components/feedback";
import { Logo } from "@/components/logo";
import { Spinner } from "@/components/spinner";
import { Trans } from "@/components/trans";
import { UserDropdown } from "@/components/user-dropdown";
import { IfCloudHosted } from "@/contexts/environment";
import { IfFreeUser } from "@/contexts/plan";
import { appVersion, isFeedbackEnabled } from "@/utils/constants";
import { DayjsProvider } from "@/utils/dayjs";

import { IconComponent, NextPageWithLayout } from "../../types";
import ModalProvider from "../modal/modal-provider";
import { IfGuest, UserProvider } from "../user-provider";

const NavMenuItem = ({
  href,
  target,
  label,
  icon: Icon,
  className,
}: {
  icon: IconComponent;
  href: string;
  target?: string;
  label: React.ReactNode;
  className?: string;
}) => {
  const router = useRouter();
  return (
    <Button variant="ghost" asChild>
      <Link
        target={target}
        href={href}
        className={cn(
          router.asPath === href
            ? "text-foreground"
            : "text-muted-foreground hover:text-foreground active:bg-gray-200/50",
          className,
        )}
      >
        <Icon className="h-4 w-4" />
        {label}
      </Link>
    </Button>
  );
};

const Upgrade = () => {
  return (
    <Button
      className="hidden sm:inline-flex"
      variant="primary"
      size="sm"
      asChild
    >
      <Link href="/settings/billing">
        <SparklesIcon className="-ml-0.5 h-4 w-4" />
        <Trans i18nKey="upgrade" defaults="Upgrade" />
      </Link>
    </Button>
  );
};

const LogoArea = () => {
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
    <div className="relative flex items-center justify-center gap-x-4">
      <Link
        href="/polls"
        className={clsx(
          "inline-block transition-transform active:translate-y-1",
        )}
      >
        <Logo size="sm" />
      </Link>
      <div
        className={cn(
          "pointer-events-none flex w-5 items-center justify-center text-gray-500 transition-opacity delay-500",
          isBusy ? "opacity-100" : "opacity-0",
        )}
      >
        {isBusy ? <Spinner /> : null}
      </div>
    </div>
  );
};

const Changelog = () => {
  return <FeaturebaseChangelog />;
};

const MainNav = () => {
  return (
    <m.div
      variants={{
        hidden: { y: -56, opacity: 0, height: 0 },
        visible: { y: 0, opacity: 1, height: "auto" },
      }}
      initial="hidden"
      animate="visible"
      exit="hidden"
      className="border-b bg-gray-50/50"
    >
      <Container className="flex h-14 items-center justify-between gap-x-2.5">
        <div className="flex shrink-0 gap-x-4">
          <LogoArea />
          <nav className="hidden gap-x-2 sm:flex">
            <NavMenuItem
              icon={ListIcon}
              href="/polls"
              label={<Trans i18nKey="polls" defaults="Polls" />}
            />
          </nav>
        </div>
        <div className="flex items-center gap-x-2.5">
          <nav className="flex items-center gap-x-1 sm:gap-x-1.5">
            <IfCloudHosted>
              <IfFreeUser>
                <Upgrade />
              </IfFreeUser>
            </IfCloudHosted>
            <IfGuest>
              <Button
                size="sm"
                variant="ghost"
                asChild
                className="hidden sm:flex"
              >
                <Link href="/login">
                  <Trans i18nKey="login" defaults="Login" />
                </Link>
              </Button>
            </IfGuest>
            <IfCloudHosted>
              <Changelog />
            </IfCloudHosted>
            <ClockPreferences>
              <Button size="sm" variant="ghost">
                <Clock />
              </Button>
            </ClockPreferences>
          </nav>
          <UserDropdown />
        </div>
      </Container>
    </m.div>
  );
};

export const StandardLayout: React.FunctionComponent<{
  children?: React.ReactNode;
  hideNav?: boolean;
}> = ({ children, hideNav, ...rest }) => {
  const key = hideNav ? "no-nav" : "nav";

  return (
    <UserProvider>
      <DayjsProvider>
        <Toaster />
        <ModalProvider>
          <div className="flex min-h-screen flex-col" {...rest}>
            <AnimatePresence initial={false}>
              {!hideNav ? <MainNav /> : null}
            </AnimatePresence>
            <AnimatePresence mode="wait" initial={false}>
              <m.div
                key={key}
                variants={{
                  hidden: { opacity: 0, y: -56 },
                  visible: { opacity: 1, y: 0 },
                }}
                initial="hidden"
                animate="visible"
                exit={{ opacity: 0, y: 56 }}
              >
                {children}
              </m.div>
            </AnimatePresence>
            {appVersion ? (
              <div className="fixed bottom-0 right-0 z-50 rounded-tl-md bg-gray-200/90">
                <Link
                  className="px-2 py-1 text-xs tabular-nums tracking-tight"
                  target="_blank"
                  href={`https://github.com/lukevella/rallly/releases/${appVersion}`}
                >
                  {`${appVersion}`}
                </Link>
              </div>
            ) : null}
          </div>
          {isFeedbackEnabled ? (
            <>
              <FeaturebaseIdentify />
              <FeedbackButton />
            </>
          ) : null}
        </ModalProvider>
      </DayjsProvider>
    </UserProvider>
  );
};

export const getStandardLayout: NextPageWithLayout["getLayout"] =
  function getLayout(page) {
    return <StandardLayout>{page}</StandardLayout>;
  };
