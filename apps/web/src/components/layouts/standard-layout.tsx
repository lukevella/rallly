import { FolderIcon, LoginIcon, SupportIcon } from "@rallly/icons";
import clsx from "clsx";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import React from "react";
import { Toaster } from "react-hot-toast";

import Feedback from "@/components/feedback";
import { Spinner } from "@/components/spinner";
import { Trans } from "@/components/trans";
import { CurrentUserAvatar } from "@/components/user";

import { IconComponent, NextPageWithLayout } from "../../types";
import ModalProvider from "../modal/modal-provider";
import { UserProvider, useUser } from "../user-provider";

// const appVersion = process.env.NEXT_PUBLIC_APP_VERSION
//   ? process.env.NEXT_PUBLIC_APP_VERSION
//   : null;

// const AppVersion = () => {
//   if (!appVersion) return null;

//   return (
//     <Link
//       href="https://github.com/lukevella/rallly/releases"
//       className="fixed bottom-2 left-2 hidden p-1 text-xs tabular-nums text-gray-400 lg:block"
//     >
//       {appVersion}
//     </Link>
//   );
// };

const MenuItem = ({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: IconComponent;
  label: React.ReactNode;
}) => {
  return (
    <Link
      href={href}
      className="active:text-primary-600 flex flex-col items-center gap-0.5 p-2 hover:text-slate-600"
    >
      <Icon className="h-6" />
      <span className="text-xs">{label}</span>
    </Link>
  );
};

export const StandardLayout: React.FunctionComponent<{
  children?: React.ReactNode;
}> = ({ children, ...rest }) => {
  const { user } = useUser();
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
    <>
      <Toaster />
      <ModalProvider>
        <div className="flex min-h-full flex-col md:flex-row" {...rest}>
          <div className="min-h-full shrink-0 border-b bg-gray-50 text-slate-500 md:w-24 md:border-b-0 md:border-r lg:block">
            <div className="sticky top-0 flex h-full max-h-[calc(100vh)] gap-4 md:flex-col md:py-3">
              <div className="flex grow items-center gap-6 md:flex-col">
                <div className="m-1 flex h-8 w-8 items-center justify-center">
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
                <MenuItem
                  href="/polls"
                  icon={FolderIcon}
                  label={<Trans i18nKey="myPolls" defaults="My Polls" />}
                />
              </div>
              <div className="flex items-center gap-4 md:flex-col">
                <Link
                  target="_blank"
                  href="https://support.rallly.co"
                  className="active:text-primary-600 flex flex-col items-center gap-0.5 p-2 text-xs hover:text-slate-600"
                >
                  <SupportIcon className="h-6" />
                  <Trans i18nKey="common_support" />
                </Link>
                {user.isGuest ? (
                  <MenuItem
                    href="/login"
                    icon={LoginIcon}
                    label={<Trans i18nKey="login" />}
                  />
                ) : null}
                <Link
                  href="/profile"
                  className="active:text-primary-600 flex flex-col items-center gap-0.5 p-2 hover:text-slate-600"
                >
                  <CurrentUserAvatar />
                  <div className="mx-auto w-14 truncate text-center text-sm">
                    {user.isGuest ? <Trans i18nKey="guest" /> : user.shortName}
                  </div>
                </Link>
              </div>
            </div>
          </div>
          <div className="flex min-w-0 max-w-full grow flex-col">
            {children}
          </div>
        </div>
      </ModalProvider>
    </>
  );
};

export const getStandardLayout: NextPageWithLayout["getLayout"] =
  function getLayout(page) {
    return (
      <UserProvider>
        <StandardLayout>{page}</StandardLayout>
      </UserProvider>
    );
  };
