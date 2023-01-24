import clsx from "clsx";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
import React from "react";

import { useDayjs } from "../utils/dayjs";
import { LanguageSelect } from "./poll/language-selector";

const Preferences: React.VoidFunctionComponent = () => {
  const { t } = useTranslation(["app", "common"]);

  const { weekStartsOn, setWeekStartsOn, timeFormat, setTimeFormat } =
    useDayjs();
  const router = useRouter();

  return (
    <div>
      <div className="mb-4 space-y-2">
        <div className="grow text-sm text-slate-500">
          {t("common:language")}
        </div>
        <LanguageSelect className="w-full" onChange={() => router.reload()} />
      </div>
      <div className="grow space-y-2">
        <div>
          <div className="mb-2 grow text-sm text-slate-500">
            {t("app:weekStartsOn")}
          </div>
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
                {t("app:monday")}
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
                {t("app:sunday")}
              </button>
            </div>
          </div>
        </div>
        <div className="">
          <div className="mb-2 grow text-sm text-slate-500">
            {t("app:timeFormat")}
          </div>
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
              {t("app:12h")}
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
              {t("app:24h")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Preferences;
