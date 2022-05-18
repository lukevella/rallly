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
      <div className="text-sm font-medium tracking-tight">
        {t("stepSummary", {
          current: current + 1,
          total,
        })}
      </div>
      <div className="ml-2 flex items-center">
        {[...Array(total)].map((_, i) => {
          return (
            <span
              key={i}
              className={clsx("ml-3 h-2  w-2 rounded-full transition-all", {
                "bg-indigo-400": i <= current,
                "bg-gray-300": i > current,
                "animate-pulse ring-4 ring-indigo-200": i === current,
              })}
            />
          );
        })}
      </div>
    </div>
  );
};

export default Steps;
