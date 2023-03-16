import { AnimatePresence, m } from "framer-motion";
import * as React from "react";
import { usePrevious } from "react-use";

import CheckCircle from "@/components/icons/check-circle.svg";

export interface PopularityScoreProps {
  yesScore: number;
  ifNeedBeScore?: number;
  highlight?: boolean;
}

export const ScoreSummary: React.FunctionComponent<PopularityScoreProps> =
  React.memo(function PopularityScore({ yesScore: score }) {
    const prevScore = usePrevious(score);

    const direction = prevScore !== undefined ? score - prevScore : 0;

    return (
      <div
        data-testid="popularity-score"
        className="flex items-center gap-1 text-sm font-bold tabular-nums"
      >
        <CheckCircle className="inline-block h-4 text-slate-300 transition-opacity" />
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
