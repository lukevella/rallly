"use client";

import * as React from "react";
import VoteIcon from "@/features/poll/components/vote-icon";
import type { BallotVote } from "../types";

/**
 * The answer a row shows, with a slight bounce when it changes. Only ever on a
 * change: the rows all landing at once on load isn't something to celebrate.
 */
export function BallotVoteMark({ vote }: { vote: BallotVote | undefined }) {
  const ref = React.useRef<HTMLSpanElement>(null);
  const previous = React.useRef(vote);

  React.useEffect(() => {
    if (previous.current === vote) return;
    previous.current = vote;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    ref.current?.animate(
      {
        transform: ["scale(0.9)", "scale(1.06)", "scale(1)"],
        offset: [0, 0.5, 1],
        easing: "ease-out",
      },
      { duration: 240 },
    );
  }, [vote]);

  return (
    <span ref={ref} aria-hidden="true" className="flex shrink-0">
      {vote ? (
        <VoteIcon round type={vote} className="lg:size-4" />
      ) : (
        <span className="size-5 rounded-full border border-gray-500 border-dashed lg:size-4 dark:border-gray-400" />
      )}
    </span>
  );
}
