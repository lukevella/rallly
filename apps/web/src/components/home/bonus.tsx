import Code from "@rallly/icons/code.svg";
import CursorClick from "@rallly/icons/cursor-click.svg";
import Server from "@rallly/icons/server.svg";
import { Trans, useTranslation } from "next-i18next";
import * as React from "react";

import Ban from "./ban-ads.svg";

const Bonus: React.FunctionComponent = () => {
  const { t } = useTranslation("homepage");
  return (
    <div className="mx-auto max-w-7xl px-8 py-8">
      <h2 className="heading">{t("principles")}</h2>
      <p className="subheading">{t("principlesSubheading")}</p>
      <div className="grid grid-cols-4 gap-16">
        <div className="col-span-4 md:col-span-2 lg:col-span-1">
          <div className="mb-4 text-gray-400">
            <CursorClick className="w-16" />
          </div>
          <h3 className="heading-sm">{t("noLoginRequired")}</h3>
          <div className="text text-base leading-relaxed">
            {t("noLoginRequiredDescription")}
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
              i18nKey={"openSourceDescription"}
              components={{
                a: (
                  <a
                    className="text-link"
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
            {t("selfHostableDescription")}
          </div>
        </div>
        <div className="col-span-4 md:col-span-2 lg:col-span-1">
          <div className="mb-4 text-gray-400">
            <Ban className="w-16" />
          </div>
          <h3 className="heading-sm">{t("adFree")}</h3>
          <div className="text text-base leading-relaxed">
            {t("adFreeDescription")}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Bonus;
