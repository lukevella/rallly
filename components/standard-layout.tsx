import Link from "next/link";
import React from "react";

import Logo from "../public/logo.svg";
import Newspaper from "./icons/newspaper.svg";
import Pencil from "./icons/pencil.svg";
import Support from "./icons/support.svg";

const StandardLayout: React.FunctionComponent = ({ children, ...rest }) => {
  return (
    <div className="relative min-h-full lg:flex bg-gray-50" {...rest}>
      <div className="bg-gray-100 border-b lg:border-b-0 px-4 py-2 lg:py-6 lg:px-4 lg:border-r lg:grow">
        <div className="flex lg:float-right items-center lg:items-start lg:w-40 lg:flex-col">
          <div className="grow lg:grow-0 lg:mb-8">
            <Link href="/">
              <a>
                <Logo className="text-slate-500 transition-colors w-24 lg:w-28 hover:text-indigo-500 active:text-indigo-600" />
              </a>
            </Link>
          </div>
          <div className="flex shrink-0 lg:block lg:w-full text-sm lg:text-base items-center lg:pb-4 lg:mb-4">
            <Link passHref={true} href="/new">
              <a className="flex items-center whitespace-nowrap hover:text-gray-600 hover:bg-gray-200 px-2 py-1 lg:-ml-2 rounded-md font-medium hover:no-underline space-x-2 text-gray-600 cursor-pointer transition-colors active:bg-gray-300">
                <Pencil className="w-6 h-6 opacity-75" />
                <span className="hidden md:inline-block">New Poll</span>
              </a>
            </Link>
            <a
              href="https://blog.rallly.co"
              className="flex items-center whitespace-nowrap hover:text-gray-600 hover:bg-gray-200 px-2 py-1 lg:-ml-2 rounded-md font-medium hover:no-underline space-x-2 text-gray-600 cursor-pointer transition-colors active:bg-gray-300"
            >
              <Newspaper className="w-6 h-6 opacity-75" />
              <span className="hidden md:inline-block">Blog</span>
            </a>
            <Link passHref={true} href="/support">
              <a className="flex items-center whitespace-nowrap hover:text-gray-600 hover:bg-gray-200 px-2 py-1 lg:-ml-2 rounded-md font-medium hover:no-underline space-x-2 text-gray-600 cursor-pointer transition-colors active:bg-gray-300">
                <Support className="w-6 h-6 opacity-75" />
                <span className="hidden md:inline-block">Support</span>
              </a>
            </Link>
          </div>
        </div>
      </div>
      <div className="grow min-w-0">{children}</div>
    </div>
  );
};

export default StandardLayout;
