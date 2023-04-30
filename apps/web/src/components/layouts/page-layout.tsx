import { DotsVerticalIcon, GithubIcon } from "@rallly/icons";
import clsx from "clsx";
import { domAnimation, LazyMotion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/router";
import { Trans, useTranslation } from "next-i18next";
import * as React from "react";

import Logo from "~//logo.svg";

import { Popover, PopoverContent, PopoverTrigger } from "../popover";
import Footer from "./page-layout/footer";

export interface PageLayoutProps {
  children?: React.ReactNode;
}

const Menu: React.FunctionComponent<{ className: string }> = ({
  className,
}) => {
  const { pathname } = useRouter();
  const { t } = useTranslation();
  return (
    <nav className={className}>
      <Link
        href="/"
        className={clsx(
          "hover:text-primary-600 rounded text-gray-400 transition-colors hover:no-underline hover:underline-offset-2",
          {
            "pointer-events-none font-bold text-gray-600": pathname === "/home",
          },
        )}
      >
        {t("common_home")}
      </Link>
      <Link
        href="https://blog.rallly.co"
        className={clsx(
          "hover:text-primary-600 rounded text-gray-400 transition-colors hover:no-underline hover:underline-offset-2",
        )}
      >
        {t("common_blog")}
      </Link>
      <a
        href="https://support.rallly.co"
        className="hover:text-primary-600 rounded text-gray-400 transition-colors hover:no-underline hover:underline-offset-2"
      >
        {t("common_support")}
      </a>
      <Link
        href="https://github.com/lukevella/rallly"
        className="hover:text-primary-600 rounded text-gray-400 transition-colors hover:no-underline hover:underline-offset-2"
      >
        <GithubIcon className="w-6" />
      </Link>
    </nav>
  );
};

const PageLayout: React.FunctionComponent<PageLayoutProps> = ({ children }) => {
  const { t } = useTranslation();
  return (
    <LazyMotion features={domAnimation}>
      <div className="bg-pattern min-h-full overflow-x-hidden">
        <div className="mx-auto flex max-w-7xl items-center py-8 px-8">
          <div className="grow">
            <div className="relative inline-block">
              <Link className="inline-block rounded" href="/">
                <Logo className="text-primary-600 w-40" alt="Rallly" />
              </Link>
              <span className="absolute -bottom-6 right-0 text-sm text-slate-400 transition-colors">
                <Trans
                  t={t}
                  i18nKey="homepage_3Ls"
                  components={{ e: <em /> }}
                />
              </span>
            </div>
          </div>
          <Menu className="hidden items-center space-x-8 sm:flex" />
          <Popover>
            <PopoverTrigger asChild={true}>
              <button className="hover:text-primary-600 text-gray-400 transition-colors hover:no-underline hover:underline-offset-2 sm:hidden">
                <DotsVerticalIcon className="w-5" />
              </button>
            </PopoverTrigger>
            <PopoverContent align="end">
              <Menu className="flex flex-col space-y-2 p-2" />
            </PopoverContent>
          </Popover>
        </div>
        <div className="md:min-h-[calc(100vh-460px)]">{children}</div>
        <Footer />
      </div>
    </LazyMotion>
  );
};

export default PageLayout;
