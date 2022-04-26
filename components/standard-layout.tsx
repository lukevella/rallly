import clsx from "clsx";
import Link from "next/link";
import React from "react";

import Menu from "@/components/icons/menu.svg";

import Logo from "../public/logo.svg";
import Adjustments from "./icons/adjustments.svg";
import Cash from "./icons/cash.svg";
import Github from "./icons/github.svg";
import Pencil from "./icons/pencil.svg";
import Support from "./icons/support.svg";
import Twitter from "./icons/twitter.svg";
import Popover from "./popover";
import Preferences from "./preferences";

const HomeLink = () => {
  return (
    <Link href="/">
      <a>
        <Logo className="w-28 text-slate-500 transition-colors hover:text-indigo-500 active:text-indigo-600" />
      </a>
    </Link>
  );
};

const AppMenu: React.VoidFunctionComponent<{ className?: string }> = ({
  className,
}) => {
  return (
    <div className={clsx("space-y-1", className)}>
      <Link href="/new">
        <a className="flex cursor-pointer items-center space-x-2 whitespace-nowrap rounded-md px-2 py-1 pr-4 font-medium text-slate-600 transition-colors hover:bg-gray-200 hover:text-slate-600 hover:no-underline active:bg-gray-300">
          <Pencil className="h-5 opacity-75" />
          <span className="inline-block">New Poll</span>
        </a>
      </Link>
      <Link href="/support">
        <a className="flex cursor-pointer items-center space-x-2 whitespace-nowrap rounded-md px-2 py-1 pr-4 font-medium text-slate-600 transition-colors hover:bg-gray-200 hover:text-slate-600 hover:no-underline active:bg-gray-300">
          <Support className="h-5 opacity-75" />
          <span className="inline-block">Support</span>
        </a>
      </Link>
    </div>
  );
};

const StandardLayout: React.VoidFunctionComponent<{
  children?: React.ReactNode;
}> = ({ children, ...rest }) => {
  return (
    <div
      className="relative flex min-h-full flex-col bg-gray-50 lg:flex-row"
      {...rest}
    >
      <div className="relative z-10 flex h-12 shrink-0 items-center justify-between border-b px-4 lg:hidden">
        <div>
          <HomeLink />
        </div>
        <div className="flex items-center">
          <Popover
            placement="bottom-end"
            trigger={
              <button
                type="button"
                className="flex whitespace-nowrap rounded-md px-2 py-1 font-medium text-slate-600 transition-colors hover:bg-gray-200 hover:text-slate-600 hover:no-underline active:bg-gray-300"
              >
                <Adjustments className="h-5 opacity-75" />
              </button>
            }
          >
            <Preferences />
          </Popover>
          <Popover
            trigger={
              <button
                type="button"
                className="rounded-md px-2 py-1 font-medium text-slate-600 transition-colors hover:bg-gray-200 hover:text-slate-600 hover:no-underline active:bg-gray-300"
              >
                <Menu className="w-5" />
              </button>
            }
          >
            <AppMenu className="-m-2" />
          </Popover>
        </div>
      </div>
      <div className="hidden grow px-4 pt-6 pb-5 lg:block">
        <div className="sticky top-6 float-right flex w-40 flex-col items-start">
          <div className="mb-8 grow-0 px-2">
            <HomeLink />
          </div>
          <div className="mb-4 block w-full shrink-0 grow items-center pb-4 text-base">
            <div className="mb-4">
              <Link href="/new">
                <a className="mb-1 flex cursor-pointer items-center space-x-2 whitespace-nowrap rounded-md px-2 py-1 pr-4 font-medium text-slate-600 transition-colors hover:bg-gray-200 hover:text-slate-600 hover:no-underline active:bg-gray-300">
                  <Pencil className="h-5 opacity-75" />
                  <span className="inline-block">New Poll</span>
                </a>
              </Link>
              <Link href="/support">
                <a className="mb-1 flex cursor-pointer items-center space-x-2 whitespace-nowrap rounded-md px-2 py-1 pr-4 font-medium text-slate-600 transition-colors hover:bg-gray-200 hover:text-slate-600 hover:no-underline active:bg-gray-300">
                  <Support className="h-5 opacity-75" />
                  <span className="inline-block">Support</span>
                </a>
              </Link>
              <Popover
                placement="right-start"
                trigger={
                  <button className="flex cursor-pointer items-center space-x-2 whitespace-nowrap rounded-md px-2 py-1 pr-4 font-medium text-slate-600 transition-colors hover:bg-gray-200 hover:text-slate-600 hover:no-underline active:bg-gray-300">
                    <Adjustments className="h-5 opacity-75" />
                    <span className="inline-block">Preferences</span>
                  </button>
                }
              >
                <Preferences />
              </Popover>
            </div>
          </div>
        </div>
      </div>
      <div className="min-w-0 grow">
        <div className="max-w-full md:w-[1024px] lg:min-h-[calc(100vh-64px)]">
          {children}
        </div>
        <div className="flex flex-col items-center space-y-4 px-6 pt-3 pb-6 text-slate-400 lg:h-16 lg:flex-row lg:space-y-0 lg:space-x-6 lg:py-0 lg:px-8 lg:pb-3">
          <div>
            <Link href="https://rallly.co">
              <a className="text-sm text-slate-400 transition-colors hover:text-indigo-500 hover:no-underline">
                <Logo className="h-5" />
              </a>
            </Link>
          </div>
          <div className="hidden text-slate-300 lg:block">&bull;</div>
          <div className="flex items-center justify-center space-x-6 md:justify-start">
            <Link href="/support">
              <a className="text-sm text-slate-400 transition-colors hover:text-indigo-500 hover:no-underline">
                Support
              </a>
            </Link>
            <Link href="https://github.com/lukevella/rallly/discussions">
              <a className="text-sm text-slate-400 transition-colors hover:text-indigo-500 hover:no-underline">
                Discussions
              </a>
            </Link>
            <Link href="https://blog.rallly.co">
              <a className="text-sm text-slate-400 transition-colors hover:text-indigo-500 hover:no-underline">
                Blog
              </a>
            </Link>
            <div className="hidden text-slate-300 lg:block">&bull;</div>
            <div className="flex items-center space-x-6">
              <Link href="https://twitter.com/ralllyco">
                <a className="text-sm text-slate-400 transition-colors hover:text-indigo-500 hover:no-underline">
                  <Twitter className="h-5 w-5" />
                </a>
              </Link>
              <Link href="https://github.com/lukevella/rallly">
                <a className="text-sm text-slate-400 transition-colors hover:text-indigo-500 hover:no-underline">
                  <Github className="h-5 w-5" />
                </a>
              </Link>
            </div>
          </div>
          <div className="hidden text-slate-300 lg:block">&bull;</div>
          <Link href="https://www.paypal.com/donate/?hosted_button_id=7QXP2CUBLY88E">
            <a className="inline-flex h-8 items-center rounded-full bg-slate-100 pl-2 pr-3 text-sm text-slate-400 transition-colors hover:bg-indigo-500 hover:text-white hover:no-underline focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 active:bg-indigo-600">
              <Cash className="mr-1 inline-block w-5" />
              <span>Donate</span>
            </a>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default StandardLayout;
