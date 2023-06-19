import {
  BellIcon,
  ClockIcon,
  MessageCircleIcon,
  SmartphoneIcon,
} from "@rallly/icons";
import { useTranslation } from "next-i18next";
import * as React from "react";

const Features: React.FunctionComponent = () => {
  const { t } = useTranslation();
  return (
    <div className="mx-auto max-w-7xl py-16 sm:py-24">
      <h2 className="heading text-center">{t("homepage_features")}</h2>
      <p className="subheading text-center">
        {t("homepage_featuresSubheading")}
      </p>
      <div className="grid grid-cols-2 gap-12">
        <div className="col-span-2 md:col-span-1">
          <div className="bg-primary-500 mb-4 inline-block rounded-md p-3 text-slate-50">
            <ClockIcon className="h-7 w-7" />
          </div>
          <h3 className="heading-sm flex items-center">
            {t("homepage_timeSlots")}
          </h3>
          <p className="text">{t("homepage_timeSlotsDescription")}</p>
        </div>
        <div className="col-span-2 md:col-span-1">
          <div className="mb-4 inline-block rounded-md bg-cyan-500 p-3 text-slate-50">
            <SmartphoneIcon className="h-7 w-7" />
          </div>
          <h3 className="heading-sm">{t("homepage_mobileFriendly")}</h3>
          <p className="text">{t("homepage_mobileFriendlyDescription")}</p>
        </div>
        <div className="col-span-2 md:col-span-1">
          <div className="mb-4 inline-block rounded-md bg-violet-500 p-3 text-slate-50">
            <BellIcon className="h-7 w-7" />
          </div>
          <h3 className="heading-sm">{t("homepage_notifications")}</h3>
          <p className="text">{t("homepage_notificationsDescription")}</p>
        </div>
        <div className="col-span-2 md:col-span-1">
          <div className="mb-4 inline-block rounded-md bg-pink-500 p-3 text-slate-50">
            <MessageCircleIcon className="h-7 w-7" />
          </div>
          <h3 className="heading-sm">{t("homepage_comments")}</h3>
          <p className="text">{t("homepage_commentsDescription")}</p>
        </div>
      </div>
    </div>
  );
};

export default Features;
