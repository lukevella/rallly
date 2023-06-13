import {
  flip,
  FloatingPortal,
  offset,
  size,
  useFloating,
} from "@floating-ui/react-dom-interactions";
import { Listbox } from "@headlessui/react";
import { ChevronDownIcon } from "@rallly/icons";
import clsx from "clsx";
import dayjs from "dayjs";
import * as React from "react";

import { getDuration } from "@/utils/date-time-utils";
import { stopPropagation } from "@/utils/stop-propagation";

import { styleMenuItem } from "../../../menu-styles";

export interface TimePickerProps {
  value: Date;
  after?: Date;
  className?: string;
  onChange?: (value: Date) => void;
}

const TimePicker: React.FunctionComponent<TimePickerProps> = ({
  value,
  onChange,
  className,
  after,
}) => {
  const { reference, floating, x, y, strategy, refs } = useFloating({
    placement: "bottom-start",
    strategy: "fixed",
    middleware: [
      offset(5),
      flip(),
      size({
        apply: ({ rects }) => {
          if (refs.floating.current) {
            Object.assign(refs.floating.current.style, {
              minWidth: `${rects.reference.width}px`,
            });
          }
        },
      }),
    ],
  });

  const renderOptions = () => {
    const startFromDate = after ? dayjs(after) : dayjs(value).startOf("day");

    const options: React.ReactNode[] = [];

    for (let i = 1; i <= 96; i++) {
      const optionValue = startFromDate.add(i * 15, "minutes");
      options.push(
        <Listbox.Option
          key={i}
          className={styleMenuItem}
          value={optionValue.format("YYYY-MM-DDTHH:mm:ss")}
        >
          <div className="flex items-center gap-2">
            <span>{optionValue.format("LT")}</span>
            {after ? (
              <span className="text-sm text-gray-500">
                {getDuration(dayjs(after), optionValue)}
              </span>
            ) : null}
          </div>
        </Listbox.Option>,
      );
    }
    return options;
  };

  return (
    <Listbox
      value={dayjs(value).format("YYYY-MM-DDTHH:mm:ss")}
      onChange={(newValue) => {
        onChange?.(new Date(newValue));
      }}
    >
      {(open) => (
        <>
          <div ref={reference} className={clsx("relative", className)}>
            <Listbox.Button className="btn-default text-left">
              <span className="grow truncate">{dayjs(value).format("LT")}</span>
              <span className="pointer-events-none ml-2 flex">
                <ChevronDownIcon className="h-5 w-5" />
              </span>
            </Listbox.Button>
          </div>
          <FloatingPortal>
            {open ? (
              <Listbox.Options
                style={{
                  position: strategy,
                  left: x ?? "",
                  top: y ?? "",
                }}
                ref={floating}
                className="z-50 max-h-52 overflow-auto rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
                onMouseDown={stopPropagation}
              >
                {renderOptions()}
              </Listbox.Options>
            ) : null}
          </FloatingPortal>
        </>
      )}
    </Listbox>
  );
};

export default TimePicker;
