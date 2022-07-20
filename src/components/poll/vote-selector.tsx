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
        "group relative inline-flex h-9 w-full items-center justify-center overflow-hidden rounded-md border bg-white transition-all hover:ring-4 focus-visible:border-0 focus-visible:ring-2 focus-visible:ring-primary-500",
        {
          "border-green-200 bg-green-50 hover:ring-green-100/50 active:bg-green-100/50":
            value === "yes",
          "border-amber-200 bg-amber-50 hover:ring-amber-100/50 active:bg-amber-100/50":
            value === "ifNeedBe",
          "border-gray-200 bg-gray-50 hover:ring-gray-100/50 active:bg-gray-100/50":
            value === "no",
          "border-gray-200 hover:ring-gray-100/50 active:bg-gray-100/50":
            value === undefined,
        },
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
