"use client";

import { cn } from "@rallly/ui";
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

// When each step starts, so the three read as one walkthrough rather than
// three things happening at once. Not a uniform stagger: each boundary sits
// where the previous step's cursor leaves the frame, so the next cursor
// enters as the last one exits — the first step runs long because its cursor
// walks through six dates before submitting.
const STEP_STARTS = [0, 2000, 2900];

// When the section came into view, so a step can tell how much of its slot in
// the walkthrough is left. Null until it does.
const StepCueContext = React.createContext<number | null>(null);

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
  const inView = useInView(ref, { margin: "0px 0px -15% 0px" });
  const [startedAt, setStartedAt] = React.useState<number | null>(null);

  // Each visit is a fresh cue: leaving clears the clock so coming back starts
  // a new staggered walkthrough instead of replaying against a stale one.
  React.useEffect(() => {
    setStartedAt(inView ? performance.now() : null);
  }, [inView]);

  return (
    <div ref={ref} className={className}>
      <StepCueContext.Provider value={startedAt}>
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
  const startedAt = React.useContext(StepCueContext);
  const ref = React.useRef<HTMLDivElement>(null);
  // Below lg the cards sit in a horizontal scroller, so a step can be off to
  // the side long after the section itself is on screen. Waiting for the stage
  // itself means a demo never plays out of sight; half of it keeps the card
  // peeking in past the gutter from counting as arrived.
  const arrived = useInView(ref, { amount: 0.5 });
  // Arriving and leaving use different thresholds on purpose: playing waits
  // for half the stage, but resetting waits for the last pixel, so a demo
  // never undoes itself while the user can still see it.
  const visible = useInView(ref);
  const [play, setPlay] = React.useState(false);
  const reduceMotion = useReducedMotion();
  const Demo = DEMOS[step];
  // Reduced motion skips the sequence and shows the outcome, rather than
  // playing the same timed choreography with the movement left in.
  const playback: Playback = reduceMotion ? "done" : play ? "play" : "idle";

  React.useEffect(() => {
    // Fully out of sight resets the demo, so the walkthrough replays on the
    // next visit rather than sitting on its finished frame.
    if (!visible) {
      setPlay(false);
      return;
    }
    if (startedAt === null || !arrived) {
      return;
    }
    // The schedule orders steps that arrive together: what is left of this
    // step's slot, and nothing at all for a step scrolled to later, which is
    // its own cue and should play as it lands.
    const delay = Math.max(
      0,
      (STEP_STARTS[index] ?? 0) - (performance.now() - startedAt),
    );
    const timer = setTimeout(() => setPlay(true), delay);
    return () => clearTimeout(timer);
  }, [startedAt, arrived, visible, index]);

  return (
    // Relative so each demo's cursor overlay spans the whole stage: the
    // cursor travels in stage coordinates, which are the same across the
    // three steps, making the entry and exit heights line up between cards.
    <div ref={ref} aria-hidden="true" className={cn("relative", className)}>
      <div className="w-full max-w-64">
        <Demo playback={playback} />
      </div>
    </div>
  );
};
