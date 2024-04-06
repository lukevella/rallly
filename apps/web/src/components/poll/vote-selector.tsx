import { VoteType } from "@rallly/database";
import { cn } from "@rallly/ui";
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
      className={cn(
        "focus-visible:ring-primary absolute inset-0 inline-flex items-center justify-center rounded-none hover:bg-gray-100 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-offset-1 active:bg-gray-200",
        className,
      )}
      onClick={() => {
        onChange?.(value ? getNext(value) : orderedVoteTypes[0]);
      }}
      ref={ref}
    >
      <span className="absolute flex size-7 items-center justify-center rounded-md border bg-white">
        <VoteIcon type={value} />
      </span>
    </button>
  );
});
