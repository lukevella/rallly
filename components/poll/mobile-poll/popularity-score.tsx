import { AnimatePresence, motion } from "framer-motion";
import * as React from "react";
import { usePrevious } from "react-use";

import Check from "@/components/icons/check.svg";

export interface PopularityScoreProps {
  score: number;
}

const PopularityScore: React.VoidFunctionComponent<PopularityScoreProps> = ({
  score,
}) => {
  const prevScore = usePrevious(score);

  const multiplier = prevScore !== undefined ? score - prevScore : 0;

  return (
    <div className="font-mono text-xs font-semibold text-slate-500">
      <Check className="mr-1 inline-block h-4" />
      <span className="relative inline-block h-3 w-fit">
        <AnimatePresence initial={false}>
          <motion.span
            transition={{
              duration: 0.2,
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
            className="absolute inset-0"
          >
            {score}
          </motion.span>
        </AnimatePresence>
        {/* Invisible text just to give us the right width */}
        <span className="text-transparent">{score}</span>
      </span>
    </div>
  );
};

export default React.memo(PopularityScore);
