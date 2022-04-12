import { motion } from "framer-motion";
import { useTranslation } from "next-i18next";
import Link from "next/link";
import * as React from "react";
import { UserAvatarProvider } from "../poll/user-avatar";
import PollDemo from "./poll-demo";
import ScribbleArrow from "./scribble-arrow.svg";

const Hero: React.VoidFunctionComponent = () => {
  const { t } = useTranslation("homepage");
  const names = ["Peter", "Christine", "Samantha", "Joseph"];

  return (
    <div className="lg:flex p-8 items-end max-w-7xl mx-auto">
      <div className="my-8 text-center lg:text-left">
        <h1 className="text-4xl sm:text-5xl font-bold">
          Schedule
          <br />
          <span className="text-indigo-500">group&nbsp;meetings</span>
          <br />
          with ease
        </h1>
        <div className="text-xl text-gray-400 mb-12">
          Find the right date without the back and&nbsp;forth.
        </div>
        <div className="space-x-3">
          <Link href="/new">
            <a className="focus:ring-2 focus:ring-indigo-200 transition-all text-white bg-indigo-500 hover:bg-indigo-500/90 active:bg-indigo-600/90  px-5 py-3 font-semibold hover:text-white hover:no-underline shadow-sm  hover:shadow-md rounded-lg">
              {t("getStarted")}
            </a>
          </Link>
          <Link href="/demo">
            <a
              className="text-white focus:ring-2 focus:ring-indigo-200 transition-all bg-slate-500 hover:bg-slate-500/90 active:bg-slate-600/90  px-5 py-3 font-semibold hover:text-white hover:no-underline shadow-sm  hover:shadow-md rounded-lg"
              rel="nofollow"
            >
              {t("viewDemo")}
            </a>
          </Link>
        </div>
      </div>
      <div className="hidden mt-16 lg:mt-0 lg:ml-24 pointer-events-none select-none h-[380px] md:flex items-end justify-center">
        <UserAvatarProvider seed="mock" names={names}>
          <div className="inline-block relative">
            <motion.div
              className="absolute z-20 border-4 shadow-md bg-indigo-200/10 rounded-2xl border-indigo-500 h-full"
              initial={{ opacity: 0, width: 100, scale: 1.2, translateX: 384 }}
              animate={{ opacity: 1, scale: 1.1 }}
              transition={{ type: "spring", delay: 1 }}
            />
            <motion.div
              className="absolute bg-indigo-500 text-slate-100 py-1 px-3 rounded-full z-20 text-sm"
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
              <ScribbleArrow className="absolute text-slate-400 -right-8 top-3" />
            </motion.div>
            <motion.div
              className="shadow-lg rounded-lg"
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
