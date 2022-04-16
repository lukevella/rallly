import { Transition } from "@headlessui/react";
import { Placement } from "@popperjs/core";
import clsx from "clsx";
import * as React from "react";
import ReactDOM from "react-dom";
import { usePopper } from "react-popper";
import { useClickAway, useDebounce } from "react-use";
import { preventWidows } from "utils/prevent-widows";

export interface TooltipProps {
  placement?: Placement;
  children?: React.ReactNode;
  content?: React.ReactNode;
  disabled?: boolean;
  className?: string;
}

const Tooltip: React.VoidFunctionComponent<TooltipProps> = ({
  placement,
  className,
  children,
  disabled,
  content,
}) => {
  const [referenceElement, setReferenceElement] =
    React.useState<HTMLDivElement | null>(null);
  const [popperElement, setPopperElement] =
    React.useState<HTMLDivElement | null>(null);
  const [arrowElement, setArrowElement] =
    React.useState<HTMLDivElement | null>(null);

  const { styles, attributes } = usePopper(referenceElement, popperElement, {
    placement,
    modifiers: [
      {
        name: "offset",
        options: {
          offset: [0, 14],
        },
      },
      { name: "arrow", options: { element: arrowElement, padding: 5 } },
    ],
  });

  const [isVisible, setIsVisible] = React.useState(false);

  const [debouncedValue, setDebouncedValue] = React.useState(false);

  const [, cancel] = useDebounce(
    () => {
      setDebouncedValue(isVisible);
    },
    300,
    [isVisible],
  );

  const portal = document.getElementById("portal");

  const [key, setKey] = React.useState(0);

  React.useEffect(() => {
    setKey((k) => k + 1);
  }, [content]);

  const ref = React.useRef<HTMLDivElement | null>(null);

  useClickAway(ref, () => {
    setIsVisible(false);
  });

  if (disabled) {
    return <>{children}</>;
  }
  return (
    <>
      <div
        key={key}
        className={clsx("inline-block", className)}
        onMouseEnter={() => {
          setIsVisible(true);
        }}
        onMouseLeave={() => {
          setIsVisible(false);
          setDebouncedValue(false);
          cancel();
        }}
        ref={(el) => {
          setReferenceElement(el);
          ref.current = el;
        }}
      >
        {children}
      </div>
      {portal
        ? ReactDOM.createPortal(
            <div
              ref={setPopperElement}
              style={styles.popper}
              {...attributes.popper}
            >
              <Transition
                className="px-3 py-2 rounded-md pointer-events-none bg-slate-700 text-slate-200 shadow-md"
                as={"div"}
                show={debouncedValue}
                enter="transition transform duration-100"
                enterFrom="opacity-0 -translate-y-2"
                enterTo="opacity-100 translate-y-0"
              >
                <div
                  ref={setArrowElement}
                  className="tooltip-arrow w-3 h-3 border-transparent border-[6px]"
                  style={styles.arrow}
                  data-popper-arrow
                ></div>
                {typeof content === "string" ? preventWidows(content) : content}
              </Transition>
            </div>,
            portal,
          )
        : null}
    </>
  );
};

export default Tooltip;
