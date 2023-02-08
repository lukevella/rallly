import { VoteType } from "@prisma/client";
import clsx from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import * as React from "react";

import VoteIcon from "./vote-icon";

export interface VoteSelectorProps {
  value?: VoteType;
  onChange?: (value: VoteType) => void;
  onFocus?: React.FocusEventHandler<HTMLButtonElement>;
  onBlur?: React.FocusEventHandler<HTMLButtonElement>;
  onKeyDown?: React.KeyboardEventHandler<HTMLButtonElement>;
  className?: string;
}

const orderedVoteTypes: VoteType[] = ["yes", "ifNeedBe", "no"];

const getNext = (value: VoteType) => {
  return orderedVoteTypes[
    (orderedVoteTypes.indexOf(value) + 1) % orderedVoteTypes.length
  ];
};

export const VoteSelector = React.forwardRef<
  HTMLButtonElement,
  VoteSelectorProps
>(function VoteSelector(
  { value, onChange, onFocus, onBlur, onKeyDown, className },
  ref,
) {
  return (
    <button
      data-testid="vote-selector"
      type="button"
      onFocus={onFocus}
      onBlur={onBlur}
      onKeyDown={onKeyDown}
      className={clsx(
        "btn-default relative w-full items-center justify-center overflow-hidden focus-visible:border-0 focus-visible:ring-2 focus-visible:ring-primary-500",
        className,
      )}
      onClick={() => {
        onChange?.(value ? getNext(value) : orderedVoteTypes[0]);
      }}
      ref={ref}
    >
      <AnimatePresence initial={false}>
        <motion.span
          className="absolute flex items-center justify-center"
          transition={{ duration: 0.2 }}
          initial={{ opacity: 0, scale: 1.5, y: -45 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.5, y: 45 }}
          key={value}
        >
          <VoteIcon type={value} />
        </motion.span>
      </AnimatePresence>
    </button>
  );
});
