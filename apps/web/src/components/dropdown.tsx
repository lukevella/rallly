import {
  autoUpdate,
  flip,
  FloatingPortal,
  offset,
  Placement,
  useFloating,
} from "@floating-ui/react-dom-interactions";
import { Menu } from "@headlessui/react";
import clsx from "clsx";
import Link from "next/link";
import * as React from "react";

import { transformOriginByPlacement } from "@/utils/constants";
import { stopPropagation } from "@/utils/stop-propagation";

export interface DropdownProps {
  trigger?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  placement?: Placement;
}

const Dropdown: React.FunctionComponent<DropdownProps> = ({
  children,
  className,
  trigger,
  placement: preferredPlacement,
}) => {
  const { reference, floating, x, y, strategy, placement, refs, update } =
    useFloating({
      strategy: "fixed",
      placement: preferredPlacement,
      middleware: [offset(5), flip()],
    });

  const animationOrigin = transformOriginByPlacement[placement];

  React.useEffect(() => {
    if (!refs.reference.current || !refs.floating.current) {
      return;
    }
    // Only call this when the floating element is rendered
    return autoUpdate(refs.reference.current, refs.floating.current, update);
  }, [refs.reference, refs.floating, update]);

  return (
    <Menu>
      {({ open }) => (
        <>
          <Menu.Button as="div" className={className} ref={reference}>
            {trigger}
          </Menu.Button>
          <FloatingPortal>
            {open ? (
              <Menu.Items
                className={clsx(
                  "animate-popIn z-50 divide-gray-100 rounded-md bg-white p-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none",
                  animationOrigin,
                )}
                onMouseDown={stopPropagation}
                ref={floating}
                style={{
                  position: strategy,
                  left: x ?? "",
                  top: y ?? "",
                }}
              >
                {children}
              </Menu.Items>
            ) : null}
          </FloatingPortal>
        </>
      )}
    </Menu>
  );
};

export const DropdownItem: React.FunctionComponent<{
  icon?: React.ComponentType<{ className?: string }>;
  label?: React.ReactNode;
  disabled?: boolean;
  href?: string;
  onClick?: React.MouseEventHandler<HTMLElement>;
}> = ({ icon: Icon, label, onClick, disabled, href }) => {
  const Element = href ? Link : "button";
  return (
    <Menu.Item disabled={disabled}>
      {({ active }) => (
        <Element
          // TODO (Luke Vella) [2023-02-10]: Find a better solution for having a mixture of links and buttons
          // in a dropdown
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          href={href as any}
          disabled={disabled}
          onClick={onClick}
          className={clsx(
            "flex w-full items-center whitespace-nowrap rounded py-1.5 pl-2 pr-4 font-medium text-slate-600",
            {
              "bg-slate-100": active,
              "opacity-50": disabled,
            },
          )}
        >
          {Icon && <Icon className={clsx("mr-2 h-5 shrink-0")} />}
          {label}
        </Element>
      )}
    </Menu.Item>
  );
};

export default Dropdown;
