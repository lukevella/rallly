import { cn } from "@rallly/ui";
import { AnimatePresence, m } from "framer-motion";
import { User2Icon } from "lucide-react";
import * as React from "react";
import { usePrevious } from "react-use";

import { usePoll } from "@/components/poll-context";
import { IfScoresVisible } from "@/components/visibility";

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
    <IfScoresVisible>
      <ScoreSummary
        yesScore={yes}
        ifNeedBeScore={ifNeedBe}
        highScore={highScore}
        highlight={score === highScore && score > 1}
      />
    </IfScoresVisible>
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
      <span
        className="inline-flex h-4 gap-px text-xs font-normal"
        data-testid="popularity-score"
      >
        <span
          className={cn(
            "relative inline-flex items-center gap-x-1 rounded-l px-1 text-xs font-normal tabular-nums",
            highlight ? "bg-green-500  text-green-50" : "",
            highlight && ifNeedBeScore > 0 ? "rounded-r-none" : "rounded-r",
          )}
          style={{
            opacity: Math.max(score / highScore, 0.2),
          }}
        >
          <AnimatePresence initial={false} mode="wait">
            <m.span
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
              {yesScore}
            </m.span>
          </AnimatePresence>
        </span>
        {highlight && ifNeedBeScore > 0 ? (
          <span className="rounded-r bg-amber-400 px-1 text-amber-50">
            {ifNeedBeScore}
          </span>
        ) : null}
      </span>
    );
  });
