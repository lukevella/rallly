import { Switch as HeadlessSwitch } from "@headlessui/react";
import clsx from "clsx";
import * as React from "react";

export interface SwitchProps {
  checked?: boolean;
  onChange: (checked: boolean) => void;
  srDescription?: string;
}

const Switch: React.VoidFunctionComponent<SwitchProps> = ({
  checked = false,
  onChange,
  srDescription,
  ...rest
}) => {
  return (
    <HeadlessSwitch
      checked={checked}
      onChange={onChange}
      className={clsx(
        "relative inline-flex flex-shrink-0 h-6 w-10 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus-visible:ring-2  focus-visible:ring-white focus-visible:ring-opacity-75",
        {
          "bg-gray-200": !checked,
          "bg-green-500": checked,
        },
      )}
      {...rest}
    >
      {srDescription ? <span className="sr-only">{srDescription}</span> : null}
      <span
        aria-hidden="true"
        className={clsx(
          "pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg transform ring-0 transition ease-in-out duration-200",
          {
            "translate-x-4": checked,
            "translate-x-0": !checked,
          },
        )}
      />
    </HeadlessSwitch>
  );
};

export default Switch;
