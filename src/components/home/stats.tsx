import Link from "next/link";
import { useTranslation } from "next-i18next";
import * as React from "react";

const Stats: React.VoidFunctionComponent = () => {
  const { t } = useTranslation("homepage");
  return (
    <div className="py-16">
      <h2 className="heading text-center">Stats</h2>
      <p className="subheading text-center">100,000+ polls created</p>
      <div className="flex justify-center space-x-3">
        <Link href="/new">
          <a className="bg-primary-500 hover:bg-primary-500/90 focus:ring-primary-200 active:bg-primary-600/90 rounded-lg px-5 py-3  font-semibold text-white shadow-sm transition-all hover:text-white hover:no-underline  hover:shadow-md focus:ring-2">
            {t("getStarted")}
          </a>
        </Link>
        <Link href="/demo">
          <a
            className="focus:ring-primary-200 rounded-lg bg-slate-500 px-5 py-3 font-semibold text-white  shadow-sm transition-all hover:bg-slate-500/90 hover:text-white hover:no-underline hover:shadow-md  focus:ring-2 active:bg-slate-600/90"
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
