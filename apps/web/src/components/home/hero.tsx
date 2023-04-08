import { m } from "framer-motion";
import Link from "next/link";
import { Trans, useTranslation } from "next-i18next";
import * as React from "react";

import { DayjsProvider } from "../../utils/dayjs";
import { UserAvatarProvider } from "../poll/user-avatar";
import PollDemo from "./poll-demo";
import ScribbleArrow from "./scribble-arrow.svg";

const Hero: React.FunctionComponent = () => {
  const { t } = useTranslation("homepage");
  const names = ["Peter", "Christine", "Samantha", "Joseph"];

  return (
    <div className="mx-auto max-w-7xl items-end p-8 lg:flex lg:justify-between">
      <div className="my-8 text-center lg:text-left">
        <h1 className="text-4xl font-bold text-slate-800 sm:text-5xl">
          <Trans
            t={t}
            i18nKey="heroText"
            components={{
              br: <br />,
              s: <span className="text-primary-600 whitespace-nowrap" />,
            }}
          />
        </h1>
        <div className="mb-12 text-xl text-slate-500">{t("heroSubText")}</div>
        <div className="space-x-3">
          <Link
            href="/new"
            locale={false}
            className="bg-primary-500 hover:bg-primary-600/90 active:bg-primary-500/90 rounded-md px-5 py-3 font-semibold text-white  shadow-sm transition-all hover:text-white hover:no-underline hover:shadow-md"
          >
            {t("getStarted")}
          </Link>
          <Link
            href="/demo"
            locale={false}
            className="rounded-md bg-slate-500 px-5 py-3 font-semibold text-white shadow-sm  transition-all hover:bg-slate-500/90 hover:text-white hover:no-underline hover:shadow-md active:bg-slate-600/90"
            rel="nofollow"
          >
            {t("liveDemo")}
          </Link>
        </div>
      </div>
      <div className="pointer-events-none mt-24 hidden h-[380px] select-none items-end justify-center md:flex lg:mt-8 lg:ml-8">
        <UserAvatarProvider seed="mock" names={names}>
          <DayjsProvider>
            <div className="relative inline-block">
              <m.div
                className="border-primary-600 bg-primary-200/10 absolute z-20 h-full rounded-2xl border-4 shadow-md"
                initial={{ opacity: 0, width: 100, scale: 1.1, x: 480 }}
                animate={{ opacity: 1, x: 381 }}
                transition={{ type: "spring", delay: 1 }}
              />
              <m.div
                className="bg-primary-600 absolute z-20 rounded-full py-1 px-3 text-sm text-slate-100"
                initial={{
                  opacity: 0,
                  right: 190,
                  top: -65,
                  translateY: 50,
                }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ type: "spring", delay: 2 }}
              >
                {t("perfect")} 🤩
                <ScribbleArrow className="absolute -right-8 top-3 text-slate-500" />
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
          </DayjsProvider>
        </UserAvatarProvider>
      </div>
    </div>
  );
};

export default Hero;
