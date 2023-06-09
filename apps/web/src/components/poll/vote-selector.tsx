import { VoteType } from "@rallly/database";
import clsx from "clsx";
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
        "relative flex h-9 items-center justify-center overflow-hidden rounded-md border hover:bg-gray-50 active:bg-gray-100",
        className,
      )}
      onClick={() => {
        onChange?.(value ? getNext(value) : orderedVoteTypes[0]);
      }}
      ref={ref}
    >
      <VoteIcon type={value} />
    </button>
  );
});
