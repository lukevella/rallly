import { ChevronLeftIcon, ChevronRightIcon } from "@rallly/icons";
import { useTranslation } from "next-i18next";
import * as React from "react";

export interface DateNavigationToolbarProps {
  year: number;
  label: string;
  onPrevious: () => void;
  onNext: () => void;
  onToday: () => void;
}

const DateNavigationToolbar: React.FunctionComponent<
  DateNavigationToolbarProps
> = ({ year, label, onPrevious, onToday, onNext }) => {
  const { t } = useTranslation();
  return (
    <div className="flex h-14 w-full shrink-0 items-center border-b px-4">
      <div className="grow">
        <span className="mr-2 text-sm font-bold text-gray-400">{year}</span>
        <span className="text-lg font-bold text-gray-700">{label}</span>
      </div>
      <div className="flex items-center space-x-2">
        <div className="segment-button">
          <button type="button" onClick={onPrevious}>
            <ChevronLeftIcon className="h-5" />
          </button>
          <button type="button" onClick={onToday}>
            {t("today")}
          </button>
          <button type="button" onClick={onNext}>
            <ChevronRightIcon className="h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default DateNavigationToolbar;
