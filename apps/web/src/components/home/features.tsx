import { BellIcon, ChatIcon, ClockIcon, DeviceMobileIcon } from "@rallly/icons";
import { useTranslation } from "next-i18next";
import * as React from "react";

const Features: React.FunctionComponent = () => {
  const { t } = useTranslation("homepage");
  return (
    <div className="mx-auto max-w-7xl py-16 px-8">
      <h2 className="heading">{t("features")}</h2>
      <p className="subheading">{t("featuresSubheading")}</p>
      <div className="grid grid-cols-2 gap-12">
        <div className="col-span-2 md:col-span-1">
          <div className="mb-4 inline-block rounded-2xl bg-green-100/50 p-3 text-green-500">
            <ClockIcon className="h-8 w-8" />
          </div>
          <h3 className="heading-sm flex items-center">{t("timeSlots")}</h3>
          <p className="text">{t("timeSlotsDescription")}</p>
        </div>
        <div className="col-span-2 md:col-span-1">
          <div className="mb-4 inline-block rounded-2xl bg-cyan-100/50 p-3 text-cyan-500">
            <DeviceMobileIcon className="h-8 w-8" />
          </div>
          <h3 className="heading-sm">{t("mobileFriendly")}</h3>
          <p className="text">{t("mobileFriendlyDescription")}</p>
        </div>
        <div className="col-span-2 md:col-span-1">
          <div className="mb-4 inline-block rounded-2xl bg-rose-100/50 p-3 text-rose-500">
            <BellIcon className="h-8 w-8" />
          </div>
          <h3 className="heading-sm">{t("notifications")}</h3>
          <p className="text">{t("notificationsDescription")}</p>
        </div>
        <div className="col-span-2 md:col-span-1">
          <div className="mb-4 inline-block rounded-2xl bg-yellow-100/50 p-3 text-yellow-500">
            <ChatIcon className="h-8 w-8" />
          </div>
          <h3 className="heading-sm">{t("comments")}</h3>
          <p className="text">{t("commentsDescription")}</p>
        </div>
      </div>
    </div>
  );
};

export default Features;
