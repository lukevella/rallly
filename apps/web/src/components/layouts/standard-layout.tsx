import { ClockIcon, ListIcon, LogInIcon } from "@rallly/icons";
import { cn } from "@rallly/ui";
import clsx from "clsx";
import dayjs from "dayjs";
import { AnimatePresence, m } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import React from "react";
import { Toaster } from "react-hot-toast";
import { useInterval } from "react-use";
import spacetime from "spacetime";
import soft from "timezone-soft";

import { Container } from "@/components/container";
import FeedbackButton from "@/components/feedback";
import { Spinner } from "@/components/spinner";
import { Trans } from "@/components/trans";
import { UserDropdown } from "@/components/user-dropdown";
import { useDayjs } from "@/utils/dayjs";

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
    <div className="relative flex items-center justify-center gap-4 pr-8">
      <Link
        href="/polls"
        className={clsx(
          "inline-block transition-transform active:translate-y-1",
        )}
      >
        <Image
          priority={true}
          src="/static/logo.svg"
          width={120}
          height={22}
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

const Clock = () => {
  const { timeZone } = useDayjs();
  const timeZoneDisplayFormat = soft(timeZone)[0];
  const now = spacetime.now(timeZone);
  const standardAbbrev = timeZoneDisplayFormat.standard.abbr;
  const dstAbbrev = timeZoneDisplayFormat.daylight?.abbr;
  const abbrev = now.isDST() ? dstAbbrev : standardAbbrev;
  const [time, setTime] = React.useState(new Date());

  useInterval(() => {
    setTime(new Date());
  }, 1000);

  return (
    <NavMenuItem
      icon={ClockIcon}
      href="/settings/preferences"
      label={`${dayjs(time).tz(timeZone).format("LT")} ${abbrev}`}
    />
  );
};

const MainNav = () => {
  return (
    <m.div
      variants={{
        hidden: { y: -56, opacity: 0, height: 0 },
        visible: { y: 0, opacity: 1, height: "auto" },
      }}
      initial={"hidden"}
      animate="visible"
      exit={"hidden"}
      className="border-b bg-gray-50/50"
    >
      <Container className="flex h-14 items-center justify-between gap-4">
        <div className="flex shrink-0">
          <Logo />
          <nav className="hidden gap-x-2 sm:flex">
            <NavMenuItem
              icon={ListIcon}
              href="/polls"
              label={<Trans i18nKey="polls" defaults="Polls" />}
            />
          </nav>
        </div>
        <div className="flex items-center gap-x-4">
          <nav className="hidden gap-x-2 sm:flex">
            <IfGuest>
              <NavMenuItem
                icon={LogInIcon}
                href="/login"
                label={<Trans i18nKey="login" defaults="Login" />}
              />
            </IfGuest>
            <Clock />
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
        </div>
        {process.env.NEXT_PUBLIC_FEEDBACK_EMAIL ? <FeedbackButton /> : null}
      </ModalProvider>
    </UserProvider>
  );
};

export const getStandardLayout: NextPageWithLayout["getLayout"] =
  function getLayout(page) {
    return <StandardLayout>{page}</StandardLayout>;
  };
