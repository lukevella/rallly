"use client";

import { cn } from "@rallly/ui";
import { RotateCcwIcon } from "lucide-react";
import { useInView, useReducedMotion } from "motion/react";
import * as React from "react";
import { useTranslation } from "@/i18n/client";
import { DecideStepDemo } from "./decide-step-demo";
import type { Playback } from "./motion";
import { SaveStepDemo } from "./save-step-demo";

export type StepKey = "save" | "decide";

/**
 * Plays a step's demo once half of it is on screen, resets it once it is
 * fully out of sight so it replays on the next visit, and offers a replay.
 * Reduced motion shows the finished frame.
 */
export function StepStage({
  step,
  className,
}: {
  step: StepKey;
  className?: string;
}) {
  const { t } = useTranslation();
  const ref = React.useRef<HTMLDivElement>(null);
  const arrived = useInView(ref, { amount: 0.5 });
  const visible = useInView(ref);
  const reduceMotion = useReducedMotion();
  const [play, setPlay] = React.useState(false);
  const [run, setRun] = React.useState(0);
  const playback: Playback = reduceMotion ? "done" : play ? "play" : "idle";

  React.useEffect(() => {
    if (!visible) {
      setPlay(false);
      return;
    }
    if (!arrived) {
      return;
    }
    const timer = setTimeout(() => setPlay(true), run === 0 ? 200 : 400);
    return () => clearTimeout(timer);
  }, [arrived, visible, run]);

  const replay = () => {
    setPlay(false);
    setRun((count) => count + 1);
  };

  return (
    <div
      ref={ref}
      className={cn(
        "relative flex items-center justify-center overflow-hidden rounded-2xl bg-gray-200/60 p-6 dark:bg-gray-900/60",
        className,
      )}
    >
      {/* Not positioned, so each demo's cursor overlay spans the whole
          stage and the pointer enters and leaves at its edges. */}
      <div aria-hidden="true" className="w-full max-w-72">
        <div>
          {step === "save" ? (
            <SaveStepDemo playback={playback} />
          ) : (
            <DecideStepDemo playback={playback} />
          )}
        </div>
      </div>
      {reduceMotion ? null : (
        <button
          type="button"
          onClick={replay}
          aria-label={t("inviteHelpReplay", {
            defaultValue: "Replay animation",
          })}
          className="absolute right-2 bottom-2 flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-gray-300/60 hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring dark:hover:bg-gray-700/60"
        >
          <RotateCcwIcon className="size-4" />
        </button>
      )}
    </div>
  );
}
