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
  const highlight = score === highScore && score > 1;
  return (
    <IfScoresVisible>
      <ScoreSummary
        yesScore={yes}
        ifNeedBeScore={ifNeedBe}
        highScore={highScore}
        highlight={highlight}
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

const ScoreSummary: React.FunctionComponent<PopularityScoreProps> = React.memo(
  function PopularityScore({
    yesScore = 0,
    ifNeedBeScore = 0,
    highlight,
    highScore,
  }) {
    const score = yesScore + ifNeedBeScore;

    return (
      <span
        className={cn(
          "relative inline-flex items-center gap-x-1 text-xs",
          highlight ? "font-medium text-gray-800" : "font-normal text-gray-500",
        )}
        style={{
          opacity: Math.max(score / highScore, 0.2),
        }}
      >
        <User2Icon className="size-4 opacity-75" />
        <AnimatedNumber score={score} />
        {highlight ? (
          ifNeedBeScore > 0 ? (
            <span className="inline-block size-1.5 rounded-full bg-amber-400" />
          ) : null
        ) : null}
      </span>
    );
  },
);
