"use client";

import { useReducedMotion } from "motion/react";
import * as React from "react";
import { CreateStepDemo } from "./create-step-demo";
import { DecideStepDemo } from "./decide-step-demo";
import { ShareStepDemo } from "./share-step-demo";

// Owns when a step's demo animates. Hover is the trigger on pointer devices:
// each replay starts from the top, so the same card can be watched again.
// Touch devices never fire hover, so entering the viewport plays it once.
//
// The demo is picked here rather than passed in: a server component can't hand
// a client component a render prop, and the wireframes are decorative, so
// selecting on a key keeps the section a server component.
const DEMOS = {
  create: CreateStepDemo,
  share: ShareStepDemo,
  decide: DecideStepDemo,
};

export type StepKey = keyof typeof DEMOS;

export const StepStage = ({
  step,
  className,
}: {
  step: StepKey;
  className?: string;
}) => {
  const [play, setPlay] = React.useState(false);
  const reduceMotion = useReducedMotion();
  const ref = React.useRef<HTMLDivElement>(null);
  const Demo = DEMOS[step];

  React.useEffect(() => {
    const el = ref.current;
    if (!el) {
      return;
    }
    if (window.matchMedia("(hover: hover)").matches) {
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) {
          return;
        }
        observer.disconnect();
        setPlay(true);
      },
      { threshold: 0.5 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className={className}
      onPointerEnter={(event) => {
        if (event.pointerType === "touch") {
          return;
        }
        setPlay(true);
      }}
      onPointerLeave={(event) => {
        if (event.pointerType === "touch") {
          return;
        }
        setPlay(false);
      }}
    >
      <div className="w-full max-w-64">
        <Demo play={reduceMotion ? true : play} />
      </div>
    </div>
  );
};
