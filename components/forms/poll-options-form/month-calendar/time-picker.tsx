import { Combobox } from "@headlessui/react";
import clsx from "clsx";
import { addMinutes, format, isSameDay, setHours, setMinutes } from "date-fns";
import * as React from "react";
import ReactDOM from "react-dom";
import { usePopper } from "react-popper";
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

  const [query, setQuery] = React.useState("");
  const options: React.ReactNode[] = [];
  for (let i = 0; i < 96; i++) {
    const optionValue = addMinutes(startFrom, i * 15);
    if (!isSameDay(value, optionValue)) {
      // we only support event that start and end on the same day for now
      // because react-big-calendar does not support events that span days
      break;
    }
    if (query && !format(optionValue, "hhmma").includes(query)) {
      continue;
    }
    options.push(
      <Combobox.Option
        key={i}
        className={styleMenuItem}
        value={optionValue.toISOString()}
      >
        {format(optionValue, "p")}
      </Combobox.Option>,
    );
  }

  const portal = document.getElementById("portal");

  return (
    <Combobox
      value={value.toISOString()}
      onChange={(newValue) => {
        setQuery("");
        onChange?.(new Date(newValue));
      }}
    >
      <div ref={setReferenceElement} className={clsx("relative", className)}>
        {/* Remove generic params once Combobox.Input can infer the types */}
        <Combobox.Input<"input">
          className="input w-28 pr-8"
          displayValue={() => ""}
          onChange={(e) => {
            setQuery(e.target.value.toUpperCase().replace(/[\:\s]/g, ""));
          }}
        />
        <Combobox.Button className="absolute inset-0 flex h-9 cursor-default items-center px-2 text-left">
          <span className="grow truncate">
            {!query ? format(value, "p") : null}
          </span>
          <span className="pointer-events-none flex">
            <ChevronDown className="h-5 w-5" />
          </span>
        </Combobox.Button>
        {portal &&
          ReactDOM.createPortal(
            <Combobox.Options
              style={styles.popper}
              {...attributes.popper}
              ref={setPopperElement}
              className="z-50 max-h-72 w-32 overflow-auto rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
              onMouseDown={stopPropagation}
            >
              {options}
            </Combobox.Options>,
            portal,
          )}
      </div>
    </Combobox>
  );
};

export default TimePicker;
