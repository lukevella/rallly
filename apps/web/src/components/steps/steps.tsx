import { cn } from "@rallly/ui";
import { useTranslation } from "next-i18next";
import type React from "react";

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
    <div className={cn("inline-flex items-center gap-2.5", className)}>
      <div className="text-sm font-medium tracking-tight">
        {t("stepSummary", {
          current: current + 1,
          total,
        })}
      </div>
      <div className="flex items-center gap-2">
        {[...Array(total)].map((_, i) => {
          return (
            <span
              key={i.toString()}
              className={cn("h-2  w-2 rounded-full transition-all", {
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
