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
import { motion } from "framer-motion";
import Link from "next/link";
import * as React from "react";

import { transformOriginByPlacement } from "@/utils/constants";
import { stopPropagation } from "@/utils/stop-propagation";

const MotionMenuItems = motion(Menu.Items);

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
              <MotionMenuItems
                transition={{ duration: 0.1 }}
                initial={{ opacity: 0, scale: 0.9, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: -10 }}
                className={clsx(
                  "z-50 divide-gray-100 rounded-md bg-white p-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none",
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
              </MotionMenuItems>
            ) : null}
          </FloatingPortal>
        </>
      )}
    </Menu>
  );
};

const AnchorLink = React.forwardRef<
  HTMLAnchorElement,
  {
    href?: string;
    children?: React.ReactNode;
    className?: string;
  }
>(function AnchorLink(
  { href = "", className, children, ...forwardProps },
  ref,
) {
  return (
    <Link
      ref={ref}
      href={href}
      passHref
      className={clsx(
        "font-normal hover:text-white hover:no-underline",
        className,
      )}
      {...forwardProps}
    >
      {children}
    </Link>
  );
});

export const DropdownItem: React.VoidFunctionComponent<{
  icon?: React.ComponentType<{ className?: string }>;
  label?: React.ReactNode;
  disabled?: boolean;
  href?: string;
  onClick?: () => void;
}> = ({ icon: Icon, label, onClick, disabled, href }) => {
  const Element = href ? AnchorLink : "button";
  return (
    <Menu.Item disabled={disabled}>
      {({ active }) => (
        <Element
          href={href}
          onClick={onClick}
          className={clsx(
            "group flex w-full items-center rounded py-2 pl-2 pr-4",
            {
              "bg-primary-500 text-white": active,
              "text-gray-700": !active,
              "opacity-50": disabled,
            },
          )}
        >
          {Icon && (
            <Icon
              className={clsx("mr-2 h-5 w-5", {
                "text-white": active,
                "text-primary-500": !active,
              })}
            />
          )}
          {label}
        </Element>
      )}
    </Menu.Item>
  );
};

export default Dropdown;
