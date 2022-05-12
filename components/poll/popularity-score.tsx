import clsx from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import * as React from "react";
import { usePrevious } from "react-use";

import Fire from "@/components/icons/fire.svg";
import User from "@/components/icons/user-solid.svg";

export interface PopularityScoreProps {
  score: number;
  highlight?: boolean;
}

export const PopularityScore: React.VoidFunctionComponent<PopularityScoreProps> =
  React.memo(function PopularityScore({ score, highlight }) {
    const prevScore = usePrevious(score);

    const multiplier = prevScore !== undefined ? score - prevScore : 0;
    return (
      <div
        data-testid="popularity-score"
        className="relative inline-flex items-center font-mono text-sm font-semibold text-slate-500"
      >
        <AnimatePresence initial={false}>
          {highlight ? (
            <motion.div
              key={highlight ? 1 : 2}
              transition={{ type: "spring", stiffness: 200 }}
              initial={{ opacity: 0, y: 5, scale: 0 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -5, transition: { duration: 0.1 } }}
              className="absolute left-0"
            >
              <Fire className="mr-1 inline-block h-4 text-amber-500" />
            </motion.div>
          ) : null}
        </AnimatePresence>
        <User
          className={clsx(
            "mr-1 inline-block h-4 text-slate-400/80 transition-opacity",
            {
              "opacity-0": highlight,
            },
          )}
        />
        <span className="relative inline-block">
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
  });
