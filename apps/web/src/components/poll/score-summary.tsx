import CheckCircle from "@rallly/icons/check-circle.svg";
import clsx from "clsx";
import { AnimatePresence, m } from "framer-motion";
import * as React from "react";
import { usePrevious } from "react-use";

import { usePoll } from "@/components/poll-context";

export interface PopularityScoreProps {
  yesScore: number;
  ifNeedBeScore?: number;
  highlight?: boolean;
}

export const ConnectedScoreSummary: React.FunctionComponent<{
  optionId: string;
}> = ({ optionId }) => {
  const { getScore, highScore } = usePoll();
  const score = getScore(optionId);

  return (
    <ScoreSummary yesScore={score.yes} highlight={score.yes === highScore} />
  );
};

export const ScoreSummary: React.FunctionComponent<PopularityScoreProps> =
  React.memo(function PopularityScore({ yesScore: score, highlight }) {
    const prevScore = usePrevious(score);

    const direction = prevScore !== undefined ? score - prevScore : 0;

    return (
      <div
        data-testid="popularity-score"
        className={clsx(
          "flex select-none items-center gap-1 px-2 text-sm font-bold tabular-nums",
          {
            "rounded-full bg-green-50 text-green-400": highlight,
          },
          { "text-slate-400": !highlight },
        )}
      >
        <CheckCircle className="-ml-1 inline-block h-4 transition-opacity" />
        <AnimatePresence initial={false} exitBeforeEnter={true}>
          <m.span
            transition={{
              duration: 0.1,
            }}
            initial={{
              y: 10 * direction,
            }}
            animate={{ opacity: 1, y: 0 }}
            exit={{
              y: 10 * direction,
            }}
            key={score}
            className="relative"
          >
            {score}
          </m.span>
        </AnimatePresence>
      </div>
    );
  });
