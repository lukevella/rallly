import {
  flip,
  FloatingPortal,
  offset,
  size,
  useFloating,
} from "@floating-ui/react-dom-interactions";
import { Listbox } from "@headlessui/react";
import clsx from "clsx";
import dayjs from "dayjs";
import * as React from "react";

import { stopPropagation } from "@/utils/stop-propagation";

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
  const { reference, floating, x, y, strategy, refs } = useFloating({
    strategy: "fixed",
    middleware: [
      offset(5),
      flip(),
      size({
        apply: ({ reference }) => {
          if (refs.floating.current) {
            Object.assign(refs.floating.current.style, {
              width: `${reference.width}px`,
            });
          }
        },
      }),
    ],
  });

  const startFromDate = startFrom
    ? dayjs(startFrom)
    : dayjs(value).startOf("day");

  const options: React.ReactNode[] = [];
  for (let i = 0; i < 96; i++) {
    const optionValue = startFromDate.add(i * 15, "minutes");
    if (!optionValue.isSame(value, "day")) {
      // we only support event that start and end on the same day for now
      // because react-big-calendar does not support events that span days
      break;
    }
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
                {options}
              </Listbox.Options>
            ) : null}
          </FloatingPortal>
        </>
      )}
    </Listbox>
  );
};

export default TimePicker;
