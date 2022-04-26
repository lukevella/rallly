import {
  arrow,
  flip,
  FloatingPortal,
  offset,
  Placement,
  shift,
  useFloating,
  useHover,
  useInteractions,
  useRole,
} from "@floating-ui/react-dom-interactions";
import clsx from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import * as React from "react";
import { preventWidows } from "utils/prevent-widows";

export interface TooltipProps {
  placement?: Placement;
  children?: React.ReactNode;
  content?: React.ReactNode;
  disabled?: boolean;
  className?: string;
}

const Tooltip: React.VoidFunctionComponent<TooltipProps> = ({
  placement: preferredPlacement = "bottom",
  className,
  children,
  disabled,
  content,
}) => {
  const arrowRef = React.useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = React.useState(false);

  const {
    reference,
    floating,
    x,
    y,
    strategy,
    context,
    middlewareData,
    placement,
  } = useFloating({
    strategy: "fixed",
    open,
    onOpenChange: setOpen,
    placement: preferredPlacement,
    middleware: [
      offset(10),
      flip(),
      shift({ padding: 5 }),
      arrow({ element: arrowRef }),
    ],
  });

  const placementGroup = placement.split("-")[0] as
    | "top"
    | "right"
    | "bottom"
    | "left";

  const staticSide = {
    top: "bottom",
    right: "left",
    bottom: "top",
    left: "right",
  }[placementGroup];

  const { getReferenceProps, getFloatingProps } = useInteractions([
    useHover(context, {
      enabled: !disabled,
      restMs: 150,
    }),
    useRole(context, {
      role: "tooltip",
    }),
  ]);

  return (
    <>
      <div
        className={clsx("inline-block", className)}
        {...getReferenceProps({ ref: reference })}
      >
        {children}
      </div>
      <FloatingPortal>
        <AnimatePresence>
          {open ? (
            <motion.div
              className="z-30 rounded-md bg-slate-700 px-3 py-2 text-slate-200 shadow-md"
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
              animate={open ? "show" : "hidden"}
              {...getFloatingProps({
                ref: floating,
                style: {
                  position: strategy,
                  top: y ?? "",
                  left: x ?? "",
                },
              })}
            >
              <div
                ref={arrowRef}
                className="absolute rotate-45 bg-slate-700"
                style={{
                  width: 8,
                  height: 8,
                  left: middlewareData.arrow?.x,
                  top: middlewareData.arrow?.y,
                  [staticSide]: -4,
                }}
              />
              {typeof content === "string" ? preventWidows(content) : content}
            </motion.div>
          ) : null}
        </AnimatePresence>
      </FloatingPortal>
    </>
  );
};

export default Tooltip;
