import { Menu } from "@headlessui/react";
import { Placement } from "@popperjs/core";
import clsx from "clsx";
import * as React from "react";
import ReactDOM from "react-dom";
import { usePopper } from "react-popper";

export interface DropdownProps {
  trigger?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  placement?: Placement;
}

const Dropdown: React.VoidFunctionComponent<DropdownProps> = ({
  children,
  className,
  trigger,
  placement,
}) => {
  const [referenceElement, setReferenceElement] =
    React.useState<HTMLDivElement | null>(null);
  const [popperElement, setPopperElement] =
    React.useState<HTMLDivElement | null>(null);

  const { styles, attributes } = usePopper(referenceElement, popperElement, {
    placement,
    modifiers: [
      {
        name: "offset",
        options: {
          offset: [0, 5],
        },
      },
    ],
  });

  const portal = document.getElementById("portal");
  return (
    <Menu>
      <Menu.Button
        ref={setReferenceElement}
        as="div"
        className={clsx("inline-block", className)}
      >
        {trigger}
      </Menu.Button>
      {portal &&
        ReactDOM.createPortal(
          <Menu.Items
            as="div"
            ref={setPopperElement}
            style={styles.popper}
            {...attributes.popper}
            className="z-30 divide-gray-100 rounded-md bg-white p-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
          >
            {children}
          </Menu.Items>,
          portal,
        )}
    </Menu>
  );
};

export const DropdownItem: React.VoidFunctionComponent<{
  icon?: React.ComponentType<{ className?: string }>;
  label?: React.ReactNode;
  disabled?: boolean;
  onClick?: () => void;
}> = ({ icon: Icon, label, onClick, disabled }) => {
  return (
    <Menu.Item disabled={disabled}>
      {({ active }) => (
        <button
          onClick={onClick}
          className={clsx(
            "group flex w-full items-center rounded py-2 pl-2 pr-4",
            {
              "bg-indigo-500 text-white": active,
              "text-gray-700": !active,
              "opacity-50": disabled,
            },
          )}
        >
          {Icon && (
            <Icon
              className={clsx("mr-2 h-5 w-5", {
                "text-white": active,
                "text-indigo-500": !disabled,
              })}
            />
          )}
          {label}
        </button>
      )}
    </Menu.Item>
  );
};

export default Dropdown;
