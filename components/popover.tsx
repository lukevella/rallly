import { Popover as HeadlessPopover } from "@headlessui/react";
import { Placement } from "@popperjs/core";
import clsx from "clsx";
import React from "react";
import ReactDOM from "react-dom";
import { usePopper } from "react-popper";

interface PopoverProps {
  trigger: React.ReactNode;
  children?: React.ReactNode;
  placement?: Placement;
}
const Popover: React.VoidFunctionComponent<PopoverProps> = ({
  children,
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
    <HeadlessPopover as={React.Fragment}>
      <HeadlessPopover.Button
        ref={setReferenceElement}
        as="div"
        className={clsx("inline-block")}
      >
        {trigger}
      </HeadlessPopover.Button>
      {portal &&
        ReactDOM.createPortal(
          <HeadlessPopover.Panel
            className="max-w-full rounded-lg border bg-white p-4 shadow-md"
            style={styles.popper}
            {...attributes.popper}
            ref={setPopperElement}
          >
            {children}
          </HeadlessPopover.Panel>,
          portal,
        )}
    </HeadlessPopover>
  );
};

export default Popover;
