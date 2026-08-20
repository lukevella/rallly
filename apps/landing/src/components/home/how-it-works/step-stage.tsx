"use client";

import { useInView, useReducedMotion } from "motion/react";
import * as React from "react";
import { CreateStepDemo } from "./create-step-demo";
import { DecideStepDemo } from "./decide-step-demo";
import type { Playback } from "./motion";
import { ShareStepDemo } from "./share-step-demo";

// The demo is picked here rather than passed in: a server component can't hand
// a client component a render prop, and the wireframes are decorative, so
// selecting on a key keeps the section a server component.
const DEMOS = {
  create: CreateStepDemo,
  share: ShareStepDemo,
  decide: DecideStepDemo,
};

export type StepKey = keyof typeof DEMOS;

// Each step waits its turn so the three read as one walkthrough rather than
// three things happening at once. Roughly the length of a step's own sequence,
// so the next one starts as the previous settles.
const STEP_STAGGER = 900;

// The cue comes from the first step rather than each step watching itself:
// below lg the later cards sit outside the viewport in a horizontal scroller,
// so self-observation would start their sequences whenever they were scrolled
// to, breaking the order.
const StepCueContext = React.createContext(false);

export const StepCue = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  const ref = React.useRef<HTMLDivElement>(null);
  // A bottom margin so the walkthrough starts as the cards come up rather than
  // the instant the first pixel appears. Deliberately no amount threshold: the
  // strip can be taller than the viewport, where a fraction like 0.4 would
  // never be reached and the section would never play.
  const started = useInView(ref, { once: true, margin: "0px 0px -15% 0px" });

  return (
    <div ref={ref} className={className}>
      <StepCueContext.Provider value={started}>
        {children}
      </StepCueContext.Provider>
    </div>
  );
};

export const StepStage = ({
  step,
  index,
  className,
}: {
  step: StepKey;
  index: number;
  className?: string;
}) => {
  const started = React.useContext(StepCueContext);
  const [play, setPlay] = React.useState(false);
  const reduceMotion = useReducedMotion();
  const Demo = DEMOS[step];
  // Reduced motion skips the sequence and shows the outcome, rather than
  // playing the same timed choreography with the movement left in.
  const playback: Playback = reduceMotion ? "done" : play ? "play" : "idle";

  React.useEffect(() => {
    if (!started) {
      return;
    }
    // Plays once and holds: the finished state says more than the empty one,
    // so there is nothing to gain from resetting it.
    const timer = setTimeout(() => setPlay(true), index * STEP_STAGGER);
    return () => clearTimeout(timer);
  }, [started, index]);

  return (
    <div aria-hidden="true" className={className}>
      <div className="w-full max-w-64">
        <Demo playback={playback} />
      </div>
    </div>
  );
};
