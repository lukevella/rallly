import { Button } from "@rallly/ui/button";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
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
    <div className="flex h-14 w-full shrink-0 items-center px-4">
      <div className="grow font-semibold tracking-tight">
        <span className="mr-2 text-sm font-normal text-gray-500">{year}</span>
        <span className="font-semibold">{label}</span>
      </div>
      <div className="flex items-center space-x-2">
        <div className="flex items-center gap-x-2">
          <Button type="button" onClick={onPrevious}>
            <ChevronLeftIcon className="h-4 w-4" />
          </Button>
          <Button onClick={onToday}>{t("today")}</Button>
          <Button onClick={onNext}>
            <ChevronRightIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DateNavigationToolbar;
