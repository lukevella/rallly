import { User2Icon } from "@rallly/icons";
import clsx from "clsx";
import { AnimatePresence, m } from "framer-motion";
import * as React from "react";
import { usePrevious } from "react-use";

import { usePoll } from "@/components/poll-context";

export interface PopularityScoreProps {
  yesScore: number;
  ifNeedBeScore?: number;
  highlight?: boolean;
  highScore: number;
}

export const ConnectedScoreSummary: React.FunctionComponent<{
  optionId: string;
}> = ({ optionId }) => {
  const { getScore, highScore } = usePoll();
  const { yes, ifNeedBe } = getScore(optionId);
  const score = yes + ifNeedBe;
  return (
    <ScoreSummary
      yesScore={yes}
      ifNeedBeScore={ifNeedBe}
      highScore={highScore}
      highlight={score === highScore}
    />
  );
};

export const ScoreSummary: React.FunctionComponent<PopularityScoreProps> =
  React.memo(function PopularityScore({
    yesScore,
    ifNeedBeScore = 0,
    highScore,
    highlight,
  }) {
    const score = yesScore + ifNeedBeScore;
    const prevScore = usePrevious(score);

    const direction = prevScore !== undefined ? score - prevScore : 0;

    return (
      <div
        data-testid="popularity-score"
        className={clsx(
          "relative flex select-none items-center gap-1 rounded-full py-0.5 px-2 text-xs font-semibold tabular-nums",
          highlight ? "bg-green-500 text-green-50" : " text-gray-600",
        )}
        style={{
          opacity: Math.max(score / highScore, 0.2),
        }}
      >
        <User2Icon className="h-3 w-3" />
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
        {highScore === score && ifNeedBeScore > 0 ? (
          <span className="absolute -top-0.5 -right-1 h-2 w-2 rounded-full bg-amber-400 ring-2 ring-white" />
        ) : null}
      </div>
    );
  });
