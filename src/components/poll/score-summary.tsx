import clsx from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import * as React from "react";
import { usePrevious } from "react-use";

import CheckCircle from "@/components/icons/check-circle.svg";
import IfNeedBe from "@/components/icons/if-need-be.svg";

export interface PopularityScoreProps {
  yesScore: number;
  compact?: boolean;
  ifNeedBeScore?: number;
  highlight?: boolean;
}

const Score = React.forwardRef<
  HTMLDivElement,
  {
    icon: React.ComponentType<{ className?: string }>;
    score: number;
    compact?: boolean;
  }
>(function Score({ icon: Icon, score, compact }, ref) {
  const prevScore = usePrevious(score);

  const multiplier = prevScore !== undefined ? score - prevScore : 0;

  return (
    <div
      ref={ref}
      className={clsx(
        "relative inline-flex items-center font-mono font-semibold text-slate-500",
        { "text-sm": !compact, "text-xs": compact },
      )}
    >
      <Icon
        className={clsx(
          "mr-1 inline-block text-slate-400/80 transition-opacity",
          {
            "h-4": !compact,
            "h-3": compact,
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

const MotionScore = motion(Score);

export const ScoreSummary: React.VoidFunctionComponent<PopularityScoreProps> =
  React.memo(function PopularityScore({ yesScore, ifNeedBeScore, compact }) {
    return (
      <div
        data-testid="popularity-score"
        className="inline-flex items-center space-x-2"
      >
        <Score icon={CheckCircle} compact={compact} score={yesScore} />
        <AnimatePresence initial={false}>
          {ifNeedBeScore ? (
            <MotionScore
              initial={{ opacity: 0, width: 0, x: -10 }}
              animate={{ opacity: 1, width: "auto", x: 0 }}
              exit={{
                opacity: 0,
                width: 0,
                x: -10,
                transition: { duration: 0.1 },
              }}
              icon={IfNeedBe}
              compact={compact}
              score={ifNeedBeScore}
            />
          ) : null}
        </AnimatePresence>
      </div>
    );
  });
