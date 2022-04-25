import Link from "next/link";
import React from "react";

import Logo from "../public/logo.svg";
import Adjustments from "./icons/adjustments.svg";
import Github from "./icons/github.svg";
import Pencil from "./icons/pencil.svg";
import Support from "./icons/support.svg";
import Twitter from "./icons/twitter.svg";

const StandardLayout: React.FunctionComponent = ({ children, ...rest }) => {
  return (
    <div className="relative min-h-full bg-gray-50 lg:flex" {...rest}>
      <div className="border-b px-4 py-2 lg:grow lg:border-b-0 lg:py-6 lg:px-4">
        <div className="flex items-center lg:sticky lg:top-6 lg:float-right lg:w-40 lg:flex-col lg:items-start">
          <div className="grow lg:mb-8 lg:grow-0">
            <Link href="https://rallly.co">
              <a>
                <Logo className="w-24 text-slate-500 transition-colors hover:text-indigo-500 active:text-indigo-600 lg:w-28" />
              </a>
            </Link>
          </div>
          <div className="flex shrink-0 items-center text-sm lg:mb-4 lg:block lg:w-full lg:pb-4 lg:text-base">
            <div className="mb-4">
              <div className="mb-2 text-sm text-slate-500">Menu</div>
              <Link href="/new">
                <a className="mb-1 flex cursor-pointer items-center space-x-2 whitespace-nowrap rounded-md px-2 py-1 font-medium text-slate-600 transition-colors hover:bg-gray-200 hover:text-slate-600 hover:no-underline active:bg-gray-300 lg:-ml-2">
                  <Pencil className="h-5 opacity-75" />
                  <span className="hidden md:inline-block">New Poll</span>
                </a>
              </Link>
              <Link href="/preferences">
                <a className="mb-1 flex cursor-pointer items-center space-x-2 whitespace-nowrap rounded-md px-2 py-1 font-medium text-slate-600 transition-colors hover:bg-gray-200 hover:text-slate-600 hover:no-underline active:bg-gray-300 lg:-ml-2">
                  <Adjustments className="h-5 opacity-75" />
                  <span className="hidden md:inline-block">Preferences</span>
                </a>
              </Link>
              <Link href="/support">
                <a className="mb-1 flex cursor-pointer items-center space-x-2 whitespace-nowrap rounded-md px-2 py-1 font-medium text-slate-600 transition-colors hover:bg-gray-200 hover:text-slate-600 hover:no-underline active:bg-gray-300 lg:-ml-2">
                  <Support className="h-5 opacity-75" />
                  <span className="hidden md:inline-block">Support</span>
                </a>
              </Link>
            </div>
          </div>
        </div>
      </div>
      <div className="min-w-0 grow lg:w-[1024px]">
        <div className="md:min-h-[calc(100vh-64px)]">{children}</div>
        <div className="flex flex-col items-center space-y-4 px-6 pt-3 pb-6 text-slate-400 md:h-16 md:flex-row md:space-y-0 md:space-x-6 md:py-0 md:px-8 md:pb-3">
          <div>
            <Link href="https://rallly.co">
              <a className="text-sm text-slate-400 transition-colors hover:text-indigo-500 hover:no-underline">
                <Logo className="h-5" />
              </a>
            </Link>
          </div>
          <div className="hidden md:block">&bull;</div>
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
            <div className="hidden md:block">&bull;</div>
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
        </div>
      </div>
    </div>
  );
};

export default StandardLayout;
