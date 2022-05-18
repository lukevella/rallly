import clsx from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import React from "react";

import { usePollContext } from "./poll-context";

const ControlledScrollArea: React.VoidFunctionComponent<{
  children?: React.ReactNode;
  className?: string;
}> = ({ className, children }) => {
  const { availableSpace, scrollPosition } = usePollContext();

  return (
    <div
      className={clsx("min-w-0 overflow-hidden", className)}
      style={{ width: availableSpace, maxWidth: availableSpace }}
    >
      <AnimatePresence initial={false}>
        <motion.div
          className="flex h-full"
          transition={{
            type: "spring",
            mass: 0.4,
          }}
          initial={{ x: 0 }}
          animate={{ x: scrollPosition * -1 }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default ControlledScrollArea;
