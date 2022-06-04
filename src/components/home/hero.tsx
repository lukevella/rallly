import { motion } from "framer-motion";
import Link from "next/link";
import { useTranslation } from "next-i18next";
import * as React from "react";

import { UserAvatarProvider } from "../poll/user-avatar";
import PollDemo from "./poll-demo";
import ScribbleArrow from "./scribble-arrow.svg";

const Hero: React.VoidFunctionComponent = () => {
  const { t } = useTranslation("homepage");
  const names = ["Peter", "Christine", "Samantha", "Joseph"];

  return (
    <div className="mx-auto max-w-7xl items-end p-8 lg:flex lg:justify-between">
      <div className="my-8 text-center lg:text-left">
        <h1 className="text-4xl font-bold sm:text-5xl">
          Schedule
          <br />
          <span className="text-primary-500">group&nbsp;meetings</span>
          <br />
          with ease
        </h1>
        <div className="mb-12 text-xl text-gray-400">
          Find the right date without the back and&nbsp;forth.
        </div>
        <div className="space-x-3">
          <Link href="/new">
            <a className="rounded-lg bg-primary-500 px-5 py-3 font-semibold text-white shadow-sm  transition-all hover:bg-primary-500/90 hover:text-white hover:no-underline hover:shadow-md focus:ring-2  focus:ring-primary-200 active:bg-primary-600/90">
              {t("getStarted")}
            </a>
          </Link>
          <Link href="/demo">
            <a
              className="rounded-lg bg-slate-500 px-5 py-3 font-semibold text-white shadow-sm  transition-all hover:bg-slate-500/90 hover:text-white hover:no-underline hover:shadow-md focus:ring-2  focus:ring-primary-200 active:bg-slate-600/90"
              rel="nofollow"
            >
              {t("viewDemo")}
            </a>
          </Link>
        </div>
      </div>
      <div className="pointer-events-none mt-24 hidden h-[380px] select-none items-end justify-center md:flex lg:mt-8 lg:ml-24">
        <UserAvatarProvider seed="mock" names={names}>
          <div className="relative inline-block">
            <motion.div
              className="absolute z-20 h-full rounded-2xl border-4 border-primary-500 bg-primary-200/10 shadow-md"
              initial={{ opacity: 0, width: 100, scale: 1.1, x: 480 }}
              animate={{ opacity: 1, x: 381 }}
              transition={{ type: "spring", delay: 1 }}
            />
            <motion.div
              className="absolute z-20 rounded-full bg-primary-500 py-1 px-3 text-sm text-slate-100"
              initial={{
                opacity: 0,
                right: 190,
                top: -65,
                translateY: 50,
              }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: "spring", delay: 2 }}
            >
              Perfect! 🤩
              <ScribbleArrow className="absolute -right-8 top-3 text-slate-400" />
            </motion.div>
            <motion.div
              className="rounded-lg"
              transition={{ type: "spring", delay: 0.5 }}
              initial={{ opacity: 0, translateY: -100 }}
              animate={{ opacity: 1, translateY: 0 }}
            >
              <PollDemo />
            </motion.div>
          </div>
        </UserAvatarProvider>
      </div>
    </div>
  );
};

export default Hero;
