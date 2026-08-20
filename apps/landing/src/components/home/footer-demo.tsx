"use client";

import { cn } from "@rallly/ui";
import { VoteIcon } from "@rallly/ui/vote-icon";
import { useReducedMotion } from "motion/react";
import React from "react";

// A textless loop of the core Rallly cycle: a host proposes times (a row of
// blocks), invitees vote one by one, and the one column everyone said yes to
// wins. Decorative only, so the whole thing is aria-hidden and the copy
// alongside it carries the meaning.

const COLUMN_COUNT = 5;
const WINNING_COLUMN = 3;
const columns = Array.from({ length: COLUMN_COUNT }, (_, index) => index);

// Each row is one voter. Column 3 is "yes" for everyone, so it is the only
// one that can win.
const VOTES: ("yes" | "ifNeedBe" | "no")[][] = [
  ["yes", "no", "ifNeedBe", "yes", "no"],
  ["no", "yes", "no", "yes", "ifNeedBe"],
  ["ifNeedBe", "no", "yes", "yes", "no"],
];

const STEP_MS = 900;
const DECIDE_MS = 1600;
const HOLD_MS = 2600;
// Long enough for the card to finish clearing before the next pass builds it
// back up, so the loop never shows an exit and an entrance at once.
const EXIT_MS = 700;

/**
 * True once the card is meaningfully in view, and false again when it leaves.
 * The card has to have travelled a little way up the screen rather than just
 * clipped its bottom edge, so the story starts when it is actually being
 * looked at.
 *
 * Plain IntersectionObserver rather than Motion's `useInView` so the reveal
 * does not depend on an animation frame being scheduled.
 */
function useInView(ref: React.RefObject<Element | null>, enabled: boolean) {
  // Starts null — "not yet known" — so the card can stay visible until an
  // observer actually reports otherwise. Only ever hides on a real `false`.
  const [inView, setInView] = React.useState<boolean | null>(null);

  React.useEffect(() => {
    const element = ref.current;
    if (!enabled || !element) return;

    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      // Shrinking the root's bottom edge rather than setting a threshold, so
      // the trigger point does not depend on how tall the card happens to be:
      // it reveals once the top of the card has risen past the last fifth of
      // the viewport.
      { rootMargin: "0px 0px -20% 0px" },
    );
    observer.observe(element);

    return () => observer.disconnect();
  }, [ref, enabled]);

  return inView;
}

// step 0: empty card. step 1: the proposed times appear. steps 2..n+1: one
// voter row each. step n+2: decided, held. step n+3: everything clears
// together. Then back to 0 for the next pass.
const STEP_EMPTY = 0;
const STEP_TIMES = 1;
const STEP_DECIDED = VOTES.length + 2;
const STEP_EXIT = VOTES.length + 3;
const TOTAL_STEPS = VOTES.length + 4;

/**
 * Walks the cycle above, resetting to the empty card whenever it is disabled
 * so every visit replays the story from the beginning.
 */
function useCycle(enabled: boolean) {
  const [step, setStep] = React.useState(STEP_EMPTY);

  React.useEffect(() => {
    // Reset so leaving and returning always replays from the empty card
    // rather than resuming wherever the last pass stopped.
    if (!enabled) {
      setStep(STEP_EMPTY);
      return;
    }

    const delay =
      step === STEP_EXIT
        ? EXIT_MS
        : step === STEP_DECIDED
          ? HOLD_MS
          : step === STEP_DECIDED - 1
            ? DECIDE_MS
            : STEP_MS;

    const timeout = setTimeout(() => {
      setStep((current) => (current + 1) % TOTAL_STEPS);
    }, delay);

    return () => clearTimeout(timeout);
  }, [step, enabled]);

  // On the exit step everything hides at once, still wearing its decided
  // colours. Nothing un-solves on screen: the solved card simply clears.
  const exiting = step === STEP_EXIT;

  return {
    visibleRows: exiting ? 0 : Math.max(0, Math.min(step - 1, VOTES.length)),
    showTimes: !exiting && step >= STEP_TIMES,
    // Hold the decided styling through the exit so the winner fades out as
    // part of the card rather than reverting to grey first.
    decided: step === STEP_DECIDED || exiting,
  };
}

export function FooterDemo({ className }: { className?: string }) {
  const shouldReduceMotion = useReducedMotion();
  const ref = React.useRef<HTMLDivElement>(null);
  // False on the server and in browsers without IntersectionObserver, where
  // the cycle can never run and the card must show its finished state.
  const [hasObserver, setHasObserver] = React.useState(false);
  React.useEffect(() => {
    setHasObserver(typeof IntersectionObserver !== "undefined");
  }, []);
  // With reduced motion the observer never runs: nothing reveals, nothing
  // loops, the solved poll is simply there.
  const inView = useInView(ref, !shouldReduceMotion);

  // The cycle runs only while the card is in view, so scrolling to it always
  // starts from the top of the story rather than mid vote.
  const animated = inView === true && !shouldReduceMotion;
  const { visibleRows, showTimes, decided: cycleDecided } = useCycle(animated);

  // Show the solved poll only when no animation will play: reduced motion, or
  // no IntersectionObserver at all. Otherwise the cycle owns the card from the
  // first render, so it always begins on an empty card rather than snapping
  // back from a populated one when the observer reports.
  const solved = shouldReduceMotion || !hasObserver;

  const rows = solved ? VOTES.length : visibleRows;
  const times = solved ? true : showTimes;
  const decided = solved ? true : cycleDecided;

  return (
    <div
      ref={ref}
      aria-hidden
      className={cn(
        "relative isolate flex items-center justify-center py-10",
        // The card rises into place as it scrolls into view.
        // `inView === false` is the only state that hides it, so a missing
        // observer or reduced motion leaves it plainly visible.
        "transition-all duration-700 ease-out",
        inView === false
          ? "translate-y-4 opacity-0"
          : "translate-y-0 opacity-100",
        className,
      )}
    >
      {/* Graph paper filling the whole slot, dissolving well before the edges
          so the pattern has no hard border and reads as texture behind the
          panel rather than a box around it. */}
      <div
        className={cn(
          // Fills the slot's full width and bleeds up into the footer's top
          // padding, where the mask fades it out just shy of the border. No
          // sideways bleed: that would widen the page.
          "absolute -top-14 right-0 -bottom-10 left-0 -z-10",
          "bg-[linear-gradient(to_right,--theme(--color-black/2.5%)_1px,transparent_1px),linear-gradient(to_bottom,--theme(--color-black/2.5%)_1px,transparent_1px)]",
          "bg-[size:32px_32px]",
          // Fades out on every edge, so the pattern approaches the footer's
          // top border without ever meeting it.
          "[mask-image:linear-gradient(to_right,transparent,black_15%,black_85%,transparent),linear-gradient(to_bottom,transparent,black_18%,black_75%,transparent)]",
          "[mask-composite:intersect]",
        )}
      />
      {/* A soft neutral cast under the panel, sitting between it and the grid
          so the pattern darkens slightly towards the middle. */}
      <div
        className={cn(
          "absolute inset-0 -z-10",
          "[background:radial-gradient(ellipse_at_center,--theme(--color-black/4%),transparent_70%)]",
        )}
      />
      <div className="w-full max-w-sm space-y-1.5 rounded-xl border bg-white/55 p-3 shadow-[0_1px_2px_--theme(--color-black/5%),0_8px_24px_-4px_--theme(--color-black/8%)] backdrop-blur-sm">
        {/* The proposed times */}
        <div className="flex items-center gap-1.5">
          <div
            className={cn(
              "h-2 w-8 shrink-0 rounded-full bg-gray-200 transition-opacity duration-500",
              times ? "opacity-100" : "opacity-0",
            )}
          />
          {columns.map((column) => (
            <div
              key={column}
              className={cn(
                "relative h-5 flex-1 overflow-hidden rounded-md bg-gray-100",
                // The proposed times drop in first, one shortly after another.
                "transition-all duration-500",
                times
                  ? "translate-y-0 opacity-100"
                  : "-translate-y-1 opacity-0",
              )}
              style={{ transitionDelay: times ? `${column * 60}ms` : "0ms" }}
            >
              {/* The winner's accent is the same gradient as the event card in
                  the hero. It lives in its own layer and cross-fades, because
                  background-image cannot be transitioned the way a colour can. */}
              <div
                className={cn(
                  "absolute inset-0 bg-linear-to-r from-indigo-500 to-violet-500",
                  "transition-opacity duration-500",
                  decided && column === WINNING_COLUMN
                    ? "opacity-100"
                    : "opacity-0",
                )}
              />
            </div>
          ))}
        </div>

        {/* One row per voter, arriving in turn. The height is reserved for the
            full set so the footer does not reflow as rows come and go. */}
        <div className="h-[72px] space-y-1.5">
          {VOTES.map((votes, rowIndex) => (
            <div
              // biome-ignore lint/suspicious/noArrayIndexKey: fixed-length wireframe rows
              key={rowIndex}
              className={cn(
                "flex items-center gap-1.5 transition-all duration-500",
                // Rows slide in as their vote lands. Kept mounted and merely
                // transparent so nothing depends on an animation frame firing.
                rowIndex < rows
                  ? "translate-x-0 opacity-100"
                  : "-translate-x-2 opacity-0",
              )}
            >
              <div className="h-2 w-8 shrink-0 rounded-full bg-gray-200" />
              {votes.map((vote, column) => (
                <div
                  // biome-ignore lint/suspicious/noArrayIndexKey: fixed-length wireframe votes
                  key={column}
                  className={cn(
                    "flex h-5 flex-1 items-center justify-center rounded-md transition-all duration-500",
                    decided && column === WINNING_COLUMN
                      ? "bg-gray-100"
                      : "bg-gray-50",
                    // Everything but the winning column recedes once decided,
                    // so the eye lands on the agreed time.
                    decided && column !== WINNING_COLUMN && "opacity-40",
                  )}
                >
                  <VoteIcon type={vote} className="size-3.5" />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
