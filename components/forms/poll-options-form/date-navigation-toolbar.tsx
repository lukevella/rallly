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
      <div className="flex border-b items-center w-full px-4 h-14 shrink-0">
        <div className="grow">
          <span className="text-sm font-bold text-gray-400 mr-2">{year}</span>
          <span className="text-lg font-bold text-gray-700">{label}</span>
        </div>
        <div className="flex space-x-2 items-center">
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
