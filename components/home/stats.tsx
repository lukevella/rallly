import Link from "next/link";
import { useTranslation } from "next-i18next";
import * as React from "react";

const Stats: React.VoidFunctionComponent = () => {
  const { t } = useTranslation("homepage");
  return (
    <div className="py-16">
      <h2 className="heading text-center">Stats</h2>
      <p className="subheading text-center">100,000+ polls created</p>
      <div className="flex space-x-3 justify-center">
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
  );
};

export default Stats;
