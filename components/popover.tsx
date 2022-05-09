import {
  flip,
  FloatingPortal,
  offset,
  Placement,
  shift,
  useFloating,
} from "@floating-ui/react-dom-interactions";
import { Popover as HeadlessPopover } from "@headlessui/react";
import clsx from "clsx";
import { motion } from "framer-motion";
import React from "react";
import { transformOriginByPlacement } from "utils/constants";

interface PopoverProps {
  trigger: React.ReactElement;
  children?: React.ReactNode;
  placement?: Placement;
}

const MotionPanel = motion(HeadlessPopover.Panel);

const Popover: React.VoidFunctionComponent<PopoverProps> = ({
  children,
  trigger,
  placement: preferredPlacement,
}) => {
  const { reference, floating, x, y, strategy, placement } = useFloating({
    placement: preferredPlacement,
    strategy: "fixed",
    middleware: [offset(5), flip(), shift({ padding: 10 })],
  });

  const origin = transformOriginByPlacement[placement];

  return (
    <HeadlessPopover as={React.Fragment}>
      {({ open }) => (
        <>
          <HeadlessPopover.Button ref={reference} as="div">
            {trigger}
          </HeadlessPopover.Button>
          <FloatingPortal>
            {open ? (
              <MotionPanel
                transition={{ duration: 0.1 }}
                initial={{ opacity: 0, scale: 0.9, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: -10 }}
                className={clsx(
                  "z-30 max-w-full translate-x-4 rounded-lg border bg-white p-4 shadow-md",
                  origin,
                )}
                style={{
                  position: strategy,
                  left: x ?? "",
                  top: y ?? "",
                }}
                ref={floating}
              >
                {children}
              </MotionPanel>
            ) : null}
          </FloatingPortal>
        </>
      )}
    </HeadlessPopover>
  );
};

export default Popover;
