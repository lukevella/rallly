import {
  ChartSquareBarIcon,
  CogIcon,
  DotsVerticalIcon,
  FolderIcon,
  LoginIcon,
  LogoutIcon,
  SupportIcon,
} from "@rallly/icons";
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
import Dropdown, { DropdownItem } from "@/components/dropdown";

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
          "md:rounded-lg md:border md:bg-gray-100 md:p-2 md:text-gray-500",
          "md:group-hover:bg-primary-50 md:group-hover:border-primary-200 md:group-hover:text-primary-600 md:group-active:bg-primary-100 md:rounded-lg",
        )}
      >
        <Icon className="h-6" />
      </span>
      <span className="text-xs group-active:text-gray-900">{label}</span>
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
          <div className="min-h-full shrink-0 border-b bg-gray-50 text-slate-500 md:w-20 md:border-b-0 md:border-r lg:block">
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
                  icon={ChartSquareBarIcon}
                  label={<Trans i18nKey="polls" defaults="Polls" />}
                />
              </div>
              <div className="flex items-center gap-4 md:flex-col">
                <MenuItem
                  icon={SupportIcon}
                  label={<Trans i18nKey="common_support" />}
                  target="_blank"
                  href="https://support.rallly.co"
                />
                {user.isGuest ? (
                  <MenuItem
                    href="/login"
                    icon={LoginIcon}
                    label={<Trans i18nKey="login" />}
                  />
                ) : null}
                <Link
                  href="/settings/profile"
                  className="active:text-primary-600 flex items-center p-2 hover:text-slate-600"
                >
                  <CurrentUserAvatar />
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
