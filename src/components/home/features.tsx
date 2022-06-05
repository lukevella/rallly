import { useTranslation } from "next-i18next";
import * as React from "react";

import Bell from "@/components/icons/bell.svg";
import Chat from "@/components/icons/chat.svg";
import Clock from "@/components/icons/clock.svg";
import DeviceMobile from "@/components/icons/device-mobile.svg";

const Features: React.VoidFunctionComponent = () => {
  const { t } = useTranslation("homepage");
  return (
    <div className="mx-auto max-w-7xl py-16 px-8">
      <h2 className="heading">{t("features")}</h2>
      <p className="subheading">{t("featuresSlogan")}</p>
      <div className="grid grid-cols-2 gap-12">
        <div className="col-span-2 md:col-span-1">
          <div className="mb-4 inline-block rounded-2xl bg-green-100/50 p-3 text-green-400">
            <Clock className="h-8 w-8" />
          </div>
          <h3 className="heading-sm flex items-center">
            {t("featuresTimeSlots")}
            <span className="ml-2 rounded-full bg-green-500 px-2 py-1 text-sm font-normal text-white">
              {t("newLower")}
            </span>
          </h3>
          <p className="text">
            {t("featuresTimeSlots_description")}
          </p>
        </div>
        <div className="col-span-2 md:col-span-1">
          <div className="mb-4 inline-block rounded-2xl bg-cyan-100/50 p-3 text-cyan-400">
            <DeviceMobile className="h-8 w-8" />
          </div>
          <h3 className="heading-sm">{t("featuresMobileFriendly")}</h3>
          <p className="text">
            {t("featuresMobileFriendly_description")}
          </p>
        </div>
        <div className="col-span-2 md:col-span-1">
          <div className="mb-4 inline-block rounded-2xl bg-rose-100/50 p-3 text-rose-400">
            <Bell className="h-8 w-8" />
          </div>
          <h3 className="heading-sm">{t("featuresNotifications")}</h3>
          <p className="text">
            {t("featuresNotifications_description")}
          </p>
        </div>
        <div className="col-span-2 md:col-span-1">
          <div className="mb-4 inline-block rounded-2xl bg-yellow-100/50 p-3 text-yellow-400">
            <Chat className="h-8 w-8" />
          </div>
          <h3 className="heading-sm">{t("featuresComments")}</h3>
          <p className="text">
            {t("featuresComments_description")}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Features;
