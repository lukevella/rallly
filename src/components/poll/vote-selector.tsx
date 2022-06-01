import { VoteType } from "@prisma/client";
import { AnimatePresence, motion } from "framer-motion";
import * as React from "react";

import VoteIcon from "./vote-icon";

export interface VoteSelectorProps {
  value?: VoteType;
  onChange?: (value: VoteType) => void;
  onFocus?: React.FocusEventHandler<HTMLButtonElement>;
  onBlur?: React.FocusEventHandler<HTMLButtonElement>;
  onKeyDown?: React.KeyboardEventHandler<HTMLButtonElement>;
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
>(function VoteSelector({ value, onChange, onFocus, onBlur, onKeyDown }, ref) {
  return (
    <button
      data-testid="vote-selector"
      type="button"
      onFocus={onFocus}
      onBlur={onBlur}
      onKeyDown={onKeyDown}
      className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg border bg-white shadow-sm transition focus-visible:border-0 focus-visible:ring-2 focus-visible:ring-indigo-500 active:scale-95"
      onClick={() => {
        onChange?.(value ? getNext(value) : orderedVoteTypes[0]);
      }}
      ref={ref}
    >
      <AnimatePresence initial={false}>
        <motion.span
          className="absolute flex items-center justify-center"
          transition={{ duration: 0.15 }}
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 15 }}
          key={value}
        >
          <VoteIcon type={value} />
        </motion.span>
      </AnimatePresence>
    </button>
  );
});
