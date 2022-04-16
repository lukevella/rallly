import { Placement } from "@popperjs/core";
import clsx from "clsx";
import { AnimatePresence, motion } from "framer-motion";
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
  placement = "bottom",
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

  const { styles, attributes, update } = usePopper(
    referenceElement,
    popperElement,
    {
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
    },
  );

  const [isVisible, setIsVisible] = React.useState(false);

  const [debouncedValue, setDebouncedValue] = React.useState(false);

  const [, cancel] = useDebounce(
    async () => {
      await update?.();
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
            <AnimatePresence>
              {debouncedValue ? (
                <div
                  className="pointer-events-none"
                  ref={setPopperElement}
                  style={styles.popper}
                  {...attributes.popper}
                >
                  <motion.div
                    className="rounded-md bg-slate-700 px-3 py-2 text-slate-200 shadow-md"
                    initial="hidden"
                    transition={{
                      duration: 0.1,
                    }}
                    variants={{
                      hidden: {
                        opacity: 0,
                        translateY: placement === "bottom" ? -4 : 4,
                      },
                      show: { opacity: 1, translateY: 0 },
                    }}
                    animate={debouncedValue ? "show" : "hidden"}
                  >
                    <div
                      ref={setArrowElement}
                      className="tooltip-arrow h-3 w-3 border-[6px] border-transparent"
                      style={styles.arrow}
                      data-popper-arrow
                    ></div>
                    {typeof content === "string"
                      ? preventWidows(content)
                      : content}
                  </motion.div>
                </div>
              ) : null}
            </AnimatePresence>,
            portal,
          )
        : null}
    </>
  );
};

export default Tooltip;
