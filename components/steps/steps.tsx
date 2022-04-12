import clsx from "clsx";
import { useTranslation } from "next-i18next";
import React from "react";

export interface StepsProps {
  current: number;
  total: number;
  className?: string;
}

const Steps: React.VoidFunctionComponent<StepsProps> = ({
  current,
  total,
  className,
}) => {
  const { t } = useTranslation("app");

  return (
    <div className={clsx("inline-flex items-center", className)}>
      <div className="font-medium text-sm tracking-tight">
        {t("stepSummary", {
          current: current + 1,
          total,
        })}
      </div>
      <div className="flex ml-2 items-center">
        {[...Array(total)].map((_, i) => {
          return (
            <span
              key={i}
              className={clsx("w-2 h-2  rounded-full ml-3 transition-all", {
                "bg-indigo-400": i <= current,
                "bg-gray-300": i > current,
                "ring-4 ring-indigo-200 animate-pulse": i === current,
              })}
            />
          );
        })}
      </div>
    </div>
  );
};

export default Steps;
