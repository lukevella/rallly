import { Listbox } from "@headlessui/react";
import clsx from "clsx";
import { addMinutes, isSameDay, setHours, setMinutes } from "date-fns";
import * as React from "react";
import ReactDOM from "react-dom";
import { usePopper } from "react-popper";
import { localeFormat } from "utils/date-time-utils";
import { stopPropagation } from "utils/stop-propagation";

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
  const [referenceElement, setReferenceElement] =
    React.useState<HTMLDivElement | null>(null);
  const [popperElement, setPopperElement] =
    React.useState<HTMLUListElement | null>(null);

  const { styles, attributes } = usePopper(referenceElement, popperElement, {
    modifiers: [
      {
        name: "offset",
        options: {
          offset: [0, 5],
        },
      },
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
        {localeFormat(optionValue, "p")}
      </Listbox.Option>,
    );
  }

  const portal = document.getElementById("portal");

  return (
    <Listbox
      value={value.toISOString()}
      onChange={(newValue) => {
        onChange?.(new Date(newValue));
      }}
    >
      <div ref={setReferenceElement} className={clsx("relative", className)}>
        <Listbox.Button className="btn-default text-left">
          <span className="grow truncate">{localeFormat(value, "p")}</span>
          <span className="pointer-events-none ml-2 flex">
            <ChevronDown className="h-5 w-5" />
          </span>
        </Listbox.Button>
        {portal &&
          ReactDOM.createPortal(
            <Listbox.Options
              style={styles.popper}
              {...attributes.popper}
              ref={setPopperElement}
              className="z-50 max-h-64 w-24 overflow-auto rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
              onMouseDown={stopPropagation}
            >
              {options}
            </Listbox.Options>,
            portal,
          )}
      </div>
    </Listbox>
  );
};

export default TimePicker;
