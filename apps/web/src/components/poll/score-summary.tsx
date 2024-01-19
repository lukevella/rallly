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
      <div
        data-testid="popularity-score"
        className={cn(
          "relative inline-flex select-none items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-normal tabular-nums",
          highlight
            ? "border-green-500 text-green-500"
            : "border-transparent text-gray-600",
        )}
        style={{
          opacity: Math.max(score / highScore, 0.2),
        }}
      >
        <User2Icon className="size-3" />
        <AnimatePresence initial={false} mode="wait">
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
        {highlight && ifNeedBeScore > 0 ? (
          <span className="absolute -right-1 -top-0.5 size-2 rounded-full bg-amber-400 ring-2 ring-white" />
        ) : null}
      </div>
    );
  });
