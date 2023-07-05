import { CodeIcon, MousePointerClickIcon, ServerIcon } from "@rallly/icons";
import { Trans, useTranslation } from "next-i18next";
import * as React from "react";

import Ban from "./ban-ads.svg";

const Bonus: React.FunctionComponent = () => {
  const { t } = useTranslation();
  return (
    <div>
      <h2 className="heading">{t("homepage_principles")}</h2>
      <p className="subheading">{t("homepage_principlesSubheading")}</p>
      <div className="grid grid-cols-4 gap-16">
        <div className="col-span-4 md:col-span-2 lg:col-span-1">
          <div className="mb-4 text-gray-400">
            <MousePointerClickIcon className="h-16 w-16" />
          </div>
          <h3 className="heading-sm">{t("homepage_noLoginRequired")}</h3>
          <div className="text text-base leading-relaxed">
            {t("homepage_noLoginRequiredDescription")}
          </div>
        </div>
        <div className="col-span-4 md:col-span-2 lg:col-span-1">
          <div className="mb-4 text-gray-400">
            <CodeIcon className="h-16 w-16" />
          </div>
          <h3 className="heading-sm">{t("homepage_openSource")}</h3>
          <div className="text text-base leading-relaxed">
            <Trans
              t={t}
              i18nKey="homepage_openSourceDescription"
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
            <ServerIcon className="h-16 w-16" />
          </div>
          <h3 className="heading-sm">{t("homepage_selfHostable")}</h3>
          <div className="text text-base leading-relaxed">
            {t("homepage_selfHostableDescription")}
          </div>
        </div>
        <div className="col-span-4 md:col-span-2 lg:col-span-1">
          <div className="mb-4 text-gray-400">
            <Ban className="h-16 w-16" />
          </div>
          <h3 className="heading-sm">{t("homepage_adFree")}</h3>
          <div className="text text-base leading-relaxed">
            {t("homepage_adFreeDescription")}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Bonus;
