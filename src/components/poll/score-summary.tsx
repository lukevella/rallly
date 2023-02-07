import { AnimatePresence, motion } from "framer-motion";
import * as React from "react";
import { usePrevious } from "react-use";

import User from "@/components/icons/user-solid.svg";

export interface PopularityScoreProps {
  yesScore: number;
  ifNeedBeScore?: number;
  highlight?: boolean;
}

const Score = React.forwardRef<
  HTMLDivElement,
  {
    icon: React.ComponentType<{ className?: string }>;
    score: number;
  }
>(function Score({ icon: Icon, score }, ref) {
  const prevScore = usePrevious(score);

  const multiplier = prevScore !== undefined ? score - prevScore : 0;

  return (
    <div
      ref={ref}
      className="relative inline-flex items-center text-sm font-bold"
    >
      <Icon className="mr-1 inline-block h-4 text-slate-300 transition-opacity" />
      <AnimatePresence initial={false} exitBeforeEnter={true}>
        <motion.span
          transition={{
            duration: 0.1,
          }}
          initial={{
            opacity: 0,
            y: 10 * multiplier,
          }}
          animate={{ opacity: 1, y: 0 }}
          exit={{
            opacity: 0,
            y: 10 * multiplier,
          }}
          key={score}
          className="relative"
        >
          {score}
        </motion.span>
      </AnimatePresence>
    </div>
  );
});

export const ScoreSummary: React.VoidFunctionComponent<PopularityScoreProps> =
  React.memo(function PopularityScore({ yesScore }) {
    return (
      <div data-testid="popularity-score" className="tabular-nums">
        <Score icon={User} score={yesScore} />
      </div>
    );
  });
