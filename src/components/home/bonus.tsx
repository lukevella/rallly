import * as React from "react";

import Code from "@/components/icons/code.svg";
import CursorClick from "@/components/icons/cursor-click.svg";
import Server from "@/components/icons/server.svg";

import Ban from "./ban-ads.svg";
import {Trans, useTranslation} from "next-i18next";

const Bonus: React.VoidFunctionComponent = () => {
  const { t } = useTranslation("homepage");
  return (
    <div className="mx-auto max-w-7xl px-8 pt-8 pb-24">
      <h2 className="heading">{t("principles")}</h2>
      <p className="subheading">{t("wereNotLikeOthers")}</p>
      <div className="grid grid-cols-4 gap-16">
        <div className="col-span-4 md:col-span-2 lg:col-span-1">
          <div className="mb-4 text-gray-400">
            <CursorClick className="w-16" />
          </div>
          <h3 className="heading-sm">{t("noLogin")}</h3>
          <div className="text text-base leading-relaxed">
            {t("noLogin_description")}
          </div>
        </div>
        <div className="col-span-4 md:col-span-2 lg:col-span-1">
          <div className="mb-4 text-gray-400">
            <Code className="w-16" />
          </div>
          <h3 className="heading-sm">{t("openSource")}</h3>
          <div className="text text-base leading-relaxed">
            <Trans
              t={t}
              i18nKey="openSource_description"
              components={{
                a: (
                  <a
                    href="https://github.com/lukevella/rallly"
                  />
                ),
              }}
            />
          </div>
        </div>
        <div className="col-span-4 md:col-span-2 lg:col-span-1">
          <div className="mb-4 text-gray-400">
            <Server className="w-16" />
          </div>
          <h3 className="heading-sm">{t("selfHostable")}</h3>
          <div className="text text-base leading-relaxed">
            {t("selfHostable_description")}
          </div>
        </div>
        <div className="col-span-4 md:col-span-2 lg:col-span-1">
          <div className="mb-4 text-gray-400">
            <Ban className="w-16" />
          </div>
          <h3 className="heading-sm">{t("adFree")}</h3>
          <div className="text text-base leading-relaxed">
            {t("adFree_description")}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Bonus;
