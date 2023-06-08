import { Users2Icon } from "@rallly/icons";
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
  const { yes, ifNeedBe } = getScore(optionId);
  const score = yes + ifNeedBe;
  return (
    <ScoreSummary
      yesScore={yes}
      ifNeedBeScore={ifNeedBe}
      highlight={score === highScore}
    />
  );
};

export const ScoreSummary: React.FunctionComponent<PopularityScoreProps> =
  React.memo(function PopularityScore({
    yesScore,
    ifNeedBeScore = 0,
    highlight,
  }) {
    const score = yesScore + ifNeedBeScore;
    const prevScore = usePrevious(score);

    const direction = prevScore !== undefined ? score - prevScore : 0;

    return (
      <div
        data-testid="popularity-score"
        className={clsx(
          "flex select-none items-center gap-1 rounded-full py-1 px-2 text-xs font-semibold tabular-nums",
          {
            "bg-green-500 text-green-50": highlight && ifNeedBeScore === 0,
            "bg-amber-400 text-white": highlight && ifNeedBeScore !== 0,
          },
          { "text-gray-400": !highlight },
        )}
      >
        <Users2Icon className="-ml-0.5 inline-block h-4 w-4 transition-opacity" />
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
