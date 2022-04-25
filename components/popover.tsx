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
import { AnimatePresence, motion } from "framer-motion";
import React from "react";

interface PopoverProps {
  trigger: React.ReactNode;
  children?: React.ReactNode;
  placement?: Placement;
}

const MotionPanel = motion(HeadlessPopover.Panel);

const Popover: React.VoidFunctionComponent<PopoverProps> = ({
  children,
  trigger,
  placement,
}) => {
  const { reference, floating, x, y, strategy } = useFloating({
    placement,
    strategy: "fixed",
    middleware: [offset(5), flip(), shift({ padding: 10 })],
  });

  return (
    <HeadlessPopover as={React.Fragment}>
      {({ open }) => (
        <>
          <HeadlessPopover.Button
            ref={reference}
            as="div"
            className={clsx("inline-block")}
          >
            {trigger}
          </HeadlessPopover.Button>
          <FloatingPortal>
            {open ? (
              <MotionPanel
                transition={{ duration: 0.1 }}
                initial={{ opacity: 0, scale: 0.9, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: -10 }}
                className="max-w-full translate-x-4 rounded-lg border bg-white p-4 shadow-md"
                focus={true}
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
