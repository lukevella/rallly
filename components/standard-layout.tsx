import Link from "next/link";
import React from "react";

import Logo from "../public/logo.svg";
import Newspaper from "./icons/newspaper.svg";
import Pencil from "./icons/pencil.svg";
import Support from "./icons/support.svg";

const StandardLayout: React.FunctionComponent = ({ children, ...rest }) => {
  return (
    <div className="relative min-h-full bg-gray-50 lg:flex" {...rest}>
      <div className="border-b bg-gray-100 px-4 py-2 lg:grow lg:border-b-0 lg:border-r lg:py-6 lg:px-4">
        <div className="flex items-center lg:float-right lg:w-40 lg:flex-col lg:items-start">
          <div className="grow lg:mb-8 lg:grow-0">
            <Link href="/">
              <a>
                <Logo className="w-24 text-slate-500 transition-colors hover:text-indigo-500 active:text-indigo-600 lg:w-28" />
              </a>
            </Link>
          </div>
          <div className="flex shrink-0 items-center text-sm lg:mb-4 lg:block lg:w-full lg:pb-4 lg:text-base">
            <Link passHref={true} href="/new">
              <a className="flex cursor-pointer items-center space-x-2 whitespace-nowrap rounded-md px-2 py-1 font-medium text-gray-600 transition-colors hover:bg-gray-200 hover:text-gray-600 hover:no-underline active:bg-gray-300 lg:-ml-2">
                <Pencil className="h-6 w-6 opacity-75" />
                <span className="hidden md:inline-block">New Poll</span>
              </a>
            </Link>
            <a
              href="https://blog.rallly.co"
              className="flex cursor-pointer items-center space-x-2 whitespace-nowrap rounded-md px-2 py-1 font-medium text-gray-600 transition-colors hover:bg-gray-200 hover:text-gray-600 hover:no-underline active:bg-gray-300 lg:-ml-2"
            >
              <Newspaper className="h-6 w-6 opacity-75" />
              <span className="hidden md:inline-block">Blog</span>
            </a>
            <Link passHref={true} href="/support">
              <a className="flex cursor-pointer items-center space-x-2 whitespace-nowrap rounded-md px-2 py-1 font-medium text-gray-600 transition-colors hover:bg-gray-200 hover:text-gray-600 hover:no-underline active:bg-gray-300 lg:-ml-2">
                <Support className="h-6 w-6 opacity-75" />
                <span className="hidden md:inline-block">Support</span>
              </a>
            </Link>
          </div>
        </div>
      </div>
      <div className="min-w-0 grow">{children}</div>
    </div>
  );
};

export default StandardLayout;
