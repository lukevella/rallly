import {
  flip,
  FloatingPortal,
  offset,
  size,
  useFloating,
} from "@floating-ui/react-dom-interactions";
import { Listbox } from "@headlessui/react";
import clsx from "clsx";
import * as React from "react";

import { stopPropagation } from "@/utils/stop-propagation";

import { useDayjs } from "../../../../utils/dayjs";
import ChevronDown from "../../../icons/chevron-down.svg";
import { styleMenuItem } from "../../../menu-styles";

export interface TimePickerProps {
  value: Date;
  startFrom?: Date;
  className?: string;
  onChange?: (value: Date) => void;
}

const TimePicker: React.VoidFunctionComponent<TimePickerProps> = ({
  value,
  onChange,
  className,
  startFrom,
}) => {
  const { dayjs } = useDayjs();
  const { reference, floating, x, y, strategy, refs } = useFloating({
    strategy: "fixed",
    middleware: [
      offset(5),
      flip(),
      size({
        apply: ({ rects }) => {
          if (refs.floating.current) {
            Object.assign(refs.floating.current.style, {
              width: `${rects.reference.width}px`,
            });
          }
        },
      }),
    ],
  });

  const renderOptions = () => {
    const startFromDate = startFrom
      ? dayjs(startFrom)
      : dayjs(value).startOf("day");

    const options: React.ReactNode[] = [];
    const startMinute =
      startFromDate.get("hour") * 60 + startFromDate.get("minute");
    const intervals = Math.floor((1440 - startMinute) / 15);
    for (let i = 0; i < intervals; i++) {
      const optionValue = startFromDate.add(i * 15, "minutes");
      options.push(
        <Listbox.Option
          key={i}
          className={styleMenuItem}
          value={optionValue.format("YYYY-MM-DDTHH:mm:ss")}
        >
          {optionValue.format("LT")}
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
                <ChevronDown className="h-5 w-5" />
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
