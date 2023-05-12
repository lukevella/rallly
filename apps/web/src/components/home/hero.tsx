import { m } from "framer-motion";
import Link from "next/link";
import * as React from "react";

import { Trans } from "@/components/trans";

import { DayjsProvider } from "../../utils/dayjs";
import { UserAvatarProvider } from "../poll/user-avatar";
import PollDemo from "./poll-demo";
import ScribbleArrow from "./scribble-arrow.svg";

const Hero: React.FunctionComponent = () => {
  const names = ["Peter", "Christine", "Samantha", "Joseph"];

  return (
    <div className="mx-auto flex max-w-7xl flex-col items-center p-8 sm:gap-24">
      <div className="my-8 text-center">
        <h1 className="mb-4 text-4xl font-bold text-gray-800 sm:text-5xl">
          <Trans
            i18nKey="homepage_heroText"
            components={{
              br: <br />,
              s: <span className="text-primary-600 whitespace-nowrap" />,
            }}
          />
        </h1>
        <div className="mb-12 text-xl text-gray-500">
          <Trans i18nKey="homepage_heroSubText" />
        </div>
        <div className="space-x-3">
          <Link
            href="/new"
            locale={false}
            className="bg-primary-500 hover:bg-primary-600/90 active:bg-primary-500/90 rounded-md px-5 py-3 font-semibold text-white  shadow-sm transition-all hover:text-white hover:no-underline hover:shadow-md"
          >
            <Trans i18nKey="homepage_getStarted" defaults="Get started" />
          </Link>
          <Link
            href="/demo"
            locale={false}
            className="rounded-md bg-gray-500 px-5 py-3 font-semibold text-white shadow-sm  transition-all hover:bg-gray-500/90 hover:text-white hover:no-underline hover:shadow-md active:bg-gray-600/90"
            rel="nofollow"
          >
            <Trans i18nKey="homepage_liveDemo" defaults="Live demo" />
          </Link>
        </div>
      </div>
      <div className="scale-50 select-none sm:scale-100">
        <div className="relative inline-block">
          <m.div
            className="border-primary-600 bg-primary-200/10 absolute z-20 h-full rounded-2xl border-4 shadow-md"
            initial={{ opacity: 0, width: 100, scale: 1.1, x: 480 }}
            animate={{ opacity: 1, x: 381 }}
            transition={{ type: "spring", delay: 1 }}
          />
          <m.div
            className="bg-primary-600 absolute z-20 rounded-full px-3 py-1 text-sm text-gray-100"
            initial={{
              opacity: 0,
              right: 190,
              top: -65,
              translateY: 50,
            }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "spring", delay: 2 }}
          >
            <Trans i18nKey="homepage_perfect" defaults="Perfect!" />
            <span className="ml-2">🤩</span>
            <ScribbleArrow className="absolute -right-8 top-3 text-gray-500" />
          </m.div>
          <m.div
            className="rounded-lg"
            transition={{ type: "spring", delay: 0.5 }}
            initial={{ opacity: 0, translateY: -100 }}
            animate={{ opacity: 1, translateY: 0 }}
          >
            <PollDemo />
          </m.div>
        </div>
      </div>
    </div>
  );
};

export default Hero;
