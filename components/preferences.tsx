import clsx from "clsx";
import { useTranslation } from "next-i18next";
import React from "react";

import Calendar from "@/components/icons/calendar.svg";

import { usePreferences } from "./preferences/use-preferences";

const Preferences: React.VoidFunctionComponent = () => {
  const { t } = useTranslation("app");

  const { weekStartsOn, setWeekStartsOn, timeFormat, setTimeFormat } =
    usePreferences();

  return (
    <div className="-mb-2">
      <div className="mb-4 flex items-center space-x-2 text-base font-semibold">
        <Calendar className="inline-block w-5" />
        <span>{t("timeAndDate")}</span>
      </div>
      <div className="grow">
        <div className="mb-2">
          <div className="mb-2 grow text-sm text-slate-500">Week starts on</div>
          <div>
            <div className="segment-button inline-flex">
              <button
                className={clsx({
                  "segment-button-active": weekStartsOn === "monday",
                })}
                onClick={() => {
                  setWeekStartsOn("monday");
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
                }}
                type="button"
              >
                {t("sunday")}
              </button>
            </div>
          </div>
        </div>
        <div className="mb-2">
          <div className="mb-2 grow text-sm text-slate-500">Time format</div>
          <div className="segment-button inline-flex">
            <button
              className={clsx({
                "segment-button-active": timeFormat === "12h",
              })}
              onClick={() => {
                setTimeFormat("12h");
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
