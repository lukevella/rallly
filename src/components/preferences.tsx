import clsx from "clsx";
import Cookies from "js-cookie";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
import { usePlausible } from "next-plausible";
import React from "react";

import Calendar from "@/components/icons/calendar.svg";

import { usePreferences } from "./preferences/use-preferences";

const Preferences: React.VoidFunctionComponent = () => {
  const { t } = useTranslation(["app", "common"]);

  const { weekStartsOn, setWeekStartsOn, timeFormat, setTimeFormat } =
    usePreferences();

  const router = useRouter();

  const plausible = usePlausible();
  const locale = Cookies.get("NEXT_LOCALE") ?? "en";
  return (
    <div>
      <div className="mb-4 flex items-center space-x-2 text-base font-semibold">
        <Calendar className="inline-block w-5" />
        <span>{t("app:timeAndDate")}</span>
      </div>
      <div className="grow space-y-2">
        <div className="space-y-2">
          <div className="grow text-sm text-slate-500">
            {t("common:language")}
          </div>
          <select
            className="input w-full"
            defaultValue={locale}
            onChange={(e) => {
              Cookies.set("NEXT_LOCALE", e.target.value, {
                expires: 365,
              });
              router.push(router.asPath, router.asPath, {
                locale: e.target.value,
              });
            }}
          >
            <option value="en">{t("common:english")}</option>
            <option value="de">{t("common:german")}</option>
          </select>
        </div>
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
                  plausible("Change week start", {
                    props: {
                      timeFormat: "monday",
                    },
                  });
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
                  plausible("Change week start", {
                    props: {
                      timeFormat: "sunday",
                    },
                  });
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
                plausible("Change time format", {
                  props: {
                    timeFormat: "12h",
                  },
                });
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
                plausible("Change time format", {
                  props: {
                    timeFormat: "24h",
                  },
                });
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
