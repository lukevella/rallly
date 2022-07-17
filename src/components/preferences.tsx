import clsx from "clsx";
import { useTranslation } from "next-i18next";
import { usePlausible } from "next-plausible";
import React from "react";

import Calendar from "@/components/icons/calendar.svg";

import { usePreferences } from "./preferences/use-preferences";

const Preferences: React.VoidFunctionComponent = () => {
  const { t } = useTranslation("app");

  const { weekStartsOn, setWeekStartsOn, timeFormat, setTimeFormat } =
    usePreferences();

  const plausible = usePlausible();
  return (
    <div className="-mb-2">
      <div className="mb-4 flex items-center space-x-2 text-base font-semibold">
        <Calendar className="inline-block w-5" />
        <span>{t("timeAndDate")}</span>
      </div>
      <div className="grow">
        <div className="mb-2">
          <div className="mb-2 grow text-sm text-slate-500">
            {t("weekStartsOn")}
          </div>
          <div>
            <div className="segment-button inline-flex">
              <button
                className={clsx({
                  "segment-button-active": weekStartsOn === "monday",
                })}
                onClick={() => {
                  setWeekStartsOn("monday");
                  plausible("Change week start", {
                    props: {
                      timeFormat: "monday",
                    },
                  });
                }}
                type="button"
              >
                {t("monday")}
              </button>
              <button
                className={clsx({
                  "segment-button-active": weekStartsOn === "sunday",
                })}
                onClick={() => {
                  setWeekStartsOn("sunday");
                  plausible("Change week start", {
                    props: {
                      timeFormat: "sunday",
                    },
                  });
                }}
                type="button"
              >
                {t("sunday")}
              </button>
            </div>
          </div>
        </div>
        <div className="mb-2">
          <div className="mb-2 grow text-sm text-slate-500">
            {t("timeFormat")}
          </div>
          <div className="segment-button inline-flex">
            <button
              className={clsx({
                "segment-button-active": timeFormat === "12h",
              })}
              onClick={() => {
                setTimeFormat("12h");
                plausible("Change time format", {
                  props: {
                    timeFormat: "12h",
                  },
                });
              }}
              type="button"
            >
              {t("12h")}
            </button>
            <button
              className={clsx({
                "segment-button-active": timeFormat === "24h",
              })}
              onClick={() => {
                setTimeFormat("24h");
                plausible("Change time format", {
                  props: {
                    timeFormat: "24h",
                  },
                });
              }}
              type="button"
            >
              {t("24h")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Preferences;
