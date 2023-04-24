import { CodeIcon, CursorClickIcon, ServerIcon } from "@rallly/icons";
import { Trans, useTranslation } from "next-i18next";
import * as React from "react";

import Ban from "./ban-ads.svg";

const Bonus: React.FunctionComponent = () => {
  const { t } = useTranslation();
  return (
    <div className="mx-auto max-w-7xl px-8 py-8">
      <h2 className="heading">{t("homepage.principles")}</h2>
      <p className="subheading">{t("homepage.principlesSubheading")}</p>
      <div className="grid grid-cols-4 gap-16">
        <div className="col-span-4 md:col-span-2 lg:col-span-1">
          <div className="mb-4 text-gray-400">
            <CursorClickIcon className="w-16" />
          </div>
          <h3 className="heading-sm">{t("homepage.noLoginRequired")}</h3>
          <div className="text text-base leading-relaxed">
            {t("homepage.noLoginRequiredDescription")}
          </div>
        </div>
        <div className="col-span-4 md:col-span-2 lg:col-span-1">
          <div className="mb-4 text-gray-400">
            <CodeIcon className="w-16" />
          </div>
          <h3 className="heading-sm">{t("homepage.openSource")}</h3>
          <div className="text text-base leading-relaxed">
            <Trans
              t={t}
              i18nKey="homepage.openSourceDescription"
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
            <ServerIcon className="w-16" />
          </div>
          <h3 className="heading-sm">{t("homepage.selfHostable")}</h3>
          <div className="text text-base leading-relaxed">
            {t("homepage.selfHostableDescription")}
          </div>
        </div>
        <div className="col-span-4 md:col-span-2 lg:col-span-1">
          <div className="mb-4 text-gray-400">
            <Ban className="w-16" />
          </div>
          <h3 className="heading-sm">{t("homepage.adFree")}</h3>
          <div className="text text-base leading-relaxed">
            {t("homepage.adFreeDescription")}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Bonus;
