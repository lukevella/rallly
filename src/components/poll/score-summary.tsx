import { AnimatePresence, motion } from "framer-motion";
import * as React from "react";
import { usePrevious } from "react-use";

import User from "@/components/icons/user-solid.svg";

export interface PopularityScoreProps {
  yesScore: number;
  ifNeedBeScore?: number;
  highlight?: boolean;
}

export const ScoreSummary: React.VoidFunctionComponent<PopularityScoreProps> =
  React.memo(function PopularityScore({ yesScore: score }) {
    const prevScore = usePrevious(score);

    const direction = prevScore !== undefined ? score - prevScore : 0;

    return (
      <div
        data-testid="popularity-score"
        className="flex items-center gap-1 text-sm font-bold tabular-nums"
      >
        <User className="inline-block h-4 text-slate-300 transition-opacity" />
        <AnimatePresence initial={false} exitBeforeEnter={true}>
          <motion.span
            transition={{
              duration: 0.1,
            }}
            initial={{
              opacity: 0,
              y: 10 * direction,
            }}
            animate={{ opacity: 1, y: 0 }}
            exit={{
              opacity: 0,
              y: 10 * direction,
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
