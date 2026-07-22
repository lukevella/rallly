import { Button } from "@rallly/ui/button";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import type * as React from "react";

import { useTranslation } from "@/i18n/client";

export interface DateNavigationToolbarProps {
  label: string;
  onPrevious: () => void;
  onNext: () => void;
  onToday: () => void;
}

const DateNavigationToolbar: React.FunctionComponent<
  DateNavigationToolbarProps
> = ({ label, onPrevious, onToday, onNext }) => {
  const { t } = useTranslation();
  return (
    <div className="flex w-full shrink-0 items-center gap-4 px-4 py-3">
      <div className="grow">
        <span className="text-sm">{label}</span>
      </div>
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="sm" onClick={onToday}>
          {t("today")}
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          type="button"
          onClick={onPrevious}
        >
          <ChevronLeftIcon className="size-4" />
          <span className="sr-only">
            {t("previousWeek", {
              defaultValue: "Previous week",
            })}
          </span>
        </Button>
        <Button variant="ghost" size="icon-sm" onClick={onNext}>
          <ChevronRightIcon className="size-4" />
          <span className="sr-only">
            {t("nextWeek", {
              defaultValue: "Next week",
            })}
          </span>
        </Button>
      </div>
    </div>
  );
};

export default DateNavigationToolbar;
