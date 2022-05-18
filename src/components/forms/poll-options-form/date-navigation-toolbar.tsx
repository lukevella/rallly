import * as React from "react";

import ChevronLeft from "../../icons/chevron-left.svg";
import ChevronRight from "../../icons/chevron-right.svg";

export interface DateNavigationToolbarProps {
  year: number;
  label: string;
  onPrevious: () => void;
  onNext: () => void;
  onToday: () => void;
}

const DateNavigationToolbar: React.VoidFunctionComponent<DateNavigationToolbarProps> =
  ({ year, label, onPrevious, onToday, onNext }) => {
    return (
      <div className="flex h-14 w-full shrink-0 items-center border-b px-4">
        <div className="grow">
          <span className="mr-2 text-sm font-bold text-gray-400">{year}</span>
          <span className="text-lg font-bold text-gray-700">{label}</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="segment-button">
            <button type="button" onClick={onPrevious}>
              <ChevronLeft className="h-5" />
            </button>
            <button type="button" onClick={onToday}>
              Today
            </button>
            <button type="button" onClick={onNext}>
              <ChevronRight className="h-5" />
            </button>
          </div>
        </div>
      </div>
    );
  };

export default DateNavigationToolbar;
