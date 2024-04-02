import { cn } from "@rallly/ui";
import { AnimatePresence, m } from "framer-motion";
import { UserIcon } from "lucide-react";
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

function AnimatedNumber({ score }: { score: number }) {
  const prevScore = usePrevious(score);
  const direction = prevScore !== undefined ? score - prevScore : 0;

  return (
    <AnimatePresence initial={false} mode="wait">
      <m.span
        initial={{
          y: 10 * direction,
        }}
        transition={{
          duration: 0.1,
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
  );
}

export const ScoreSummary: React.FunctionComponent<PopularityScoreProps> =
  React.memo(function PopularityScore({
    yesScore = 0,
    ifNeedBeScore = 0,
    highScore,
    highlight,
  }) {
    const score = yesScore + ifNeedBeScore;

    return (
      <span
        className="inline-flex h-5 items-center gap-px text-xs font-normal tabular-nums"
        data-testid="popularity-score"
      >
        <span
          className={cn(
            "relative inline-flex items-center gap-x-1 rounded-l px-1",
            highlight ? "bg-green-500  text-green-50" : "",
            highlight && ifNeedBeScore > 0 ? "rounded-r-none" : "rounded-r",
          )}
          style={{
            opacity: Math.max(score / highScore, 0.2),
          }}
        >
          <UserIcon className="size-3 opacity-75" />
          <AnimatedNumber score={yesScore} />
        </span>
        {highlight && ifNeedBeScore > 0 ? (
          <span className="relative inline-flex items-center rounded-r bg-amber-400 px-1 text-amber-50">
            <AnimatedNumber score={ifNeedBeScore} />
          </span>
        ) : null}
      </span>
    );
  });
