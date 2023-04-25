import clsx from "clsx";
import { useTranslation } from "next-i18next";
import React from "react";

export interface StepsProps {
  current: number;
  total: number;
  className?: string;
}

const Steps: React.FunctionComponent<StepsProps> = ({
  current,
  total,
  className,
}) => {
  const { t } = useTranslation();

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
                "bg-primary-400": i <= current,
                "bg-gray-300": i > current,
                "ring-primary-200 animate-pulse ring-4": i === current,
              })}
            />
          );
        })}
      </div>
    </div>
  );
};

export default Steps;
