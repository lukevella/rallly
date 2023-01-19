import clsx from "clsx";
import Link from "next/link";
import { useRouter } from "next/router";
import { Trans, useTranslation } from "next-i18next";
import * as React from "react";

import DotsVertical from "@/components/icons/dots-vertical.svg";
import Github from "@/components/icons/github.svg";
import Logo from "~/public/logo.svg";

import Footer from "./page-layout/footer";
import Popover from "./popover";

export interface PageLayoutProps {
  children?: React.ReactNode;
}

const Menu: React.VoidFunctionComponent<{ className: string }> = ({
  className,
}) => {
  const { pathname } = useRouter();
  const { t } = useTranslation("common");
  return (
    <nav className={className}>
      <Link
        href="/"
        className={clsx(
          "text-gray-400 transition-colors hover:text-primary-500 hover:no-underline hover:underline-offset-2",
          {
            "pointer-events-none font-bold text-gray-600": pathname === "/home",
          },
        )}
      >
        {t("home")}
      </Link>
      <Link
        href="https://blog.rallly.co"
        className={clsx(
          "text-gray-400 transition-colors hover:text-primary-500 hover:no-underline hover:underline-offset-2",
        )}
      >
        {t("blog")}
      </Link>
      <a
        href="https://support.rallly.co"
        className="text-gray-400 transition-colors hover:text-primary-500 hover:no-underline hover:underline-offset-2"
      >
        {t("support")}
      </a>
      <Link
        href="https://github.com/lukevella/rallly"
        className="text-gray-400 transition-colors hover:text-primary-500 hover:no-underline hover:underline-offset-2"
      >
        <Github className="w-6" />
      </Link>
    </nav>
  );
};

const PageLayout: React.VoidFunctionComponent<PageLayoutProps> = ({
  children,
}) => {
  const { t } = useTranslation("homepage");
  return (
    <div className="bg-pattern min-h-full overflow-x-hidden">
      <div className="mx-auto flex max-w-7xl items-center py-8 px-8">
        <div className="grow">
          <div className="relative inline-block">
            <Link href="/">
              <Logo className="w-40 text-primary-500" alt="Rallly" />
            </Link>
            <span className="absolute -bottom-6 right-0 text-sm text-slate-400 transition-colors">
              <Trans t={t} i18nKey="3Ls" components={{ e: <em /> }} />
            </span>
          </div>
        </div>
        <Menu className="hidden items-center space-x-8 md:flex" />
        <Popover
          placement="left-start"
          trigger={
            <button className="text-gray-400 transition-colors hover:text-primary-500 hover:no-underline hover:underline-offset-2 sm:hidden">
              <DotsVertical className="w-5" />
            </button>
          }
        >
          <Menu className="flex flex-col space-y-2" />
        </Popover>
      </div>
      <div className="md:min-h-[calc(100vh-460px)]">{children}</div>
      <Footer />
    </div>
  );
};

export default PageLayout;
