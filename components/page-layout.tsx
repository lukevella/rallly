import clsx from "clsx";
import dynamic from "next/dynamic";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import * as React from "react";
import { createBreakpoint } from "react-use";

import DotsVertical from "@/components/icons/dots-vertical.svg";

import Logo from "../public/logo.svg";
import Github from "./home/github.svg";
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
            "text-gray-400 hover:text-indigo-500 hover:underline-offset-2 hover:no-underline transition-colors",
            {
              "font-bold text-gray-600 pointer-events-none":
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
            "text-gray-400 hover:text-indigo-500 hover:underline-offset-2 hover:no-underline transition-colors",
          )}
        >
          Blog
        </a>
      </Link>
      <Link href="/support">
        <a
          className={clsx(
            "text-gray-400 hover:text-indigo-500 hover:underline-offset-2 hover:no-underline transition-colors",
            {
              "font-bold text-gray-600 pointer-events-none":
                pathname === "/support",
            },
          )}
        >
          Support
        </a>
      </Link>
      <Link href="https://github.com/lukevella/rallly">
        <a className="text-gray-400 hover:text-indigo-500 hover:underline-offset-2 hover:no-underline transition-colors">
          <Github className="w-8" />
        </a>
      </Link>
    </nav>
  );
};

const PageLayout: React.VoidFunctionComponent<PageLayoutProps> = ({
  children,
}) => {
  const breakpoint = useBreakpoint();
  return (
    <div className="bg-pattern min-h-full overflow-x-hidden">
      <Head>
        <title>Rallly - Support</title>
      </Head>
      <div className="py-8 flex items-center px-8 max-w-7xl mx-auto">
        <div className="grow">
          <div className="inline-block relative">
            <Link href="/">
              <a>
                <Logo className="w-40 text-indigo-500" alt="Rallly" />
              </a>
            </Link>
            <span className="absolute transition-colors text-sm text-slate-400 -bottom-6 right-0">
              Yes&mdash;with 3 <em>L</em>s
            </span>
          </div>
        </div>
        <Menu className="hidden md:flex space-x-8 items-center" />
        {breakpoint === "sm" ? (
          <Popover
            placement="left-start"
            trigger={
              <button className="text-gray-400 hover:text-indigo-500 hover:underline-offset-2 hover:no-underline transition-colors">
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
