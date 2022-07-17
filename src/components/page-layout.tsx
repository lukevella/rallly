import clsx from "clsx";
import dynamic from "next/dynamic";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { Trans, useTranslation } from "next-i18next";
import * as React from "react";
import { createBreakpoint } from "react-use";

import DotsVertical from "@/components/icons/dots-vertical.svg";
import Github from "@/components/icons/github.svg";
import Logo from "~/public/logo.svg";

import Footer from "./page-layout/footer";

const Popover = dynamic(() => import("./popover"), { ssr: false });
export interface PageLayoutProps {
  children?: React.ReactNode;
}

const useBreakpoint = createBreakpoint({ sm: 640, md: 768, lg: 1024 });

const Menu: React.VoidFunctionComponent<{ className: string }> = ({
  className,
}) => {
  const { pathname } = useRouter();
  return (
    <nav className={className}>
      <Link href="/">
        <a
          className={clsx(
            "text-gray-400 transition-colors hover:text-primary-500 hover:no-underline hover:underline-offset-2",
            {
              "pointer-events-none font-bold text-gray-600":
                pathname === "/home",
            },
          )}
        >
          Home
        </a>
      </Link>
      <Link href="https://blog.rallly.co">
        <a
          className={clsx(
            "text-gray-400 transition-colors hover:text-primary-500 hover:no-underline hover:underline-offset-2",
          )}
        >
          Blog
        </a>
      </Link>
      <a
        href="https://support.rallly.co"
        className="text-gray-400 transition-colors hover:text-primary-500 hover:no-underline hover:underline-offset-2"
      >
        Support
      </a>
      <Link href="https://github.com/lukevella/rallly">
        <a className="text-gray-400 transition-colors hover:text-primary-500 hover:no-underline hover:underline-offset-2">
          <Github className="w-6" />
        </a>
      </Link>
    </nav>
  );
};

const PageLayout: React.VoidFunctionComponent<PageLayoutProps> = ({
  children,
}) => {
  const breakpoint = useBreakpoint();
  const { t } = useTranslation("homepage");
  return (
    <div className="bg-pattern min-h-full overflow-x-hidden">
      <Head>
        <title>Rallly - Support</title>
      </Head>
      <div className="mx-auto flex max-w-7xl items-center py-8 px-8">
        <div className="grow">
          <div className="relative inline-block">
            <Link href="/">
              <a>
                <Logo className="w-40 text-primary-500" alt="Rallly" />
              </a>
            </Link>
            <span className="absolute -bottom-6 right-0 text-sm text-slate-400 transition-colors">
              <Trans t={t} i18nKey="3Ls" components={{ e: <em /> }} />
            </span>
          </div>
        </div>
        <Menu className="hidden items-center space-x-8 md:flex" />
        {breakpoint === "sm" ? (
          <Popover
            placement="left-start"
            trigger={
              <button className="text-gray-400 transition-colors hover:text-primary-500 hover:no-underline hover:underline-offset-2">
                <DotsVertical className="w-5" />
              </button>
            }
          >
            <Menu className="flex flex-col space-y-2" />
          </Popover>
        ) : null}
      </div>
      <div className="md:min-h-[calc(100vh-460px)]">{children}</div>
      <Footer />
    </div>
  );
};

export default PageLayout;
