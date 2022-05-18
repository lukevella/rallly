import {
  flip,
  FloatingPortal,
  offset,
  size,
  useFloating,
} from "@floating-ui/react-dom-interactions";
import { Listbox } from "@headlessui/react";
import clsx from "clsx";
import { addMinutes, format, isSameDay, setHours, setMinutes } from "date-fns";
import * as React from "react";

import { usePreferences } from "@/components/preferences/use-preferences";
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
  startFrom = setMinutes(setHours(value, 0), 0),
}) => {
  const { locale } = usePreferences();
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

  const options: React.ReactNode[] = [];
  for (let i = 0; i < 96; i++) {
    const optionValue = addMinutes(startFrom, i * 15);
    if (!isSameDay(value, optionValue)) {
      // we only support event that start and end on the same day for now
      // because react-big-calendar does not support events that span days
      break;
    }
    options.push(
      <Listbox.Option
        key={i}
        className={styleMenuItem}
        value={optionValue.toISOString()}
      >
        {format(optionValue, "p", { locale })}
      </Listbox.Option>,
    );
  }

  return (
    <Listbox
      value={value.toISOString()}
      onChange={(newValue) => {
        onChange?.(new Date(newValue));
      }}
    >
      {(open) => (
        <>
          <div ref={reference} className={clsx("relative", className)}>
            <Listbox.Button className="btn-default text-left">
              <span className="grow truncate">
                {format(value, "p", { locale })}
              </span>
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
