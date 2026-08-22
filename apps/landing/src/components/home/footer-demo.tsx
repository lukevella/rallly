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
  ["no", "ifNeedBe", "no", "yes", "yes"],
];

const STEP_MS = 900;
const DECIDE_MS = 1600;
const HOLD_MS = 2600;
// Long enough for the card to finish clearing before the next pass builds it
// back up, so the loop never shows an exit and an entrance at once.
const EXIT_MS = 700;

// How much of the slot must show before the card fades in, and below which it
// fades back out. Low enough that the card is already there by the time the
// slot is properly on screen, high enough to still have an off state on a
// viewport tall enough to hold the whole footer at once.
const REVEAL_RATIO = 0.35;

// Held before the card fades in, so the reveal reads as its own beat rather
// than something that already happened while the slot was scrolling in. Only
// on the way in: scrolling away fades out immediately, because a card that
// lingers after it should have gone reads as a stutter rather than a beat.
const REVEAL_DELAY_MS = 250;

/**
 * Watches the slot and reports two separate things.
 *
 * `revealed` drives the card's fade. It needs a threshold: the slot lives at
 * the bottom of the footer, so on a tall viewport it can never be scrolled off
 * the bottom edge — a bare intersection test would latch true on the way down
 * and the card would never fade back out. Requiring a fraction of the slot to
 * show gives the fade a real off state in both directions.
 *
 * `active` drives the cycle, and deliberately keeps the strict test: true while
 * any pixel is on screen. Running the cycle on the threshold instead would park
 * it while the card is still visible, which reads as an empty panel. Gating the
 * two on the same flag is what forced that trade-off before; they are separate
 * now, so the fade can be generous while the cycle stays conservative.
 *
 * Plain IntersectionObserver rather than Motion's `useInView` so the reveal
 * does not depend on an animation frame being scheduled.
 */
function useSlotVisibility(
  ref: React.RefObject<Element | null>,
  enabled: boolean,
) {
  // Both start null — "not yet known" — so the card stays visible until an
  // observer actually reports otherwise. Only ever hides on a real `false`.
  const [revealed, setRevealed] = React.useState<boolean | null>(null);
  const [active, setActive] = React.useState<boolean | null>(null);

  React.useEffect(() => {
    const element = ref.current;
    // Without the API there is nothing to observe, and constructing it would
    // throw before the solved-card fallback ever renders. Drop back to "not
    // yet known" on the way out: a new observer does not report synchronously,
    // so a stale answer left here would drive the card for the frames between
    // re-enabling and the first callback — appearing at once with no fade, or
    // staying hidden — instead of the fresh observation taking over cleanly.
    if (!enabled || !element || typeof IntersectionObserver === "undefined") {
      setRevealed(null);
      setActive(null);
      return;
    }

    // One observer, both thresholds. `intersectionRatio` is what separates the
    // two answers, so a single set of callbacks can serve both.
    const observer = new IntersectionObserver(
      ([entry]) => {
        setActive(entry.isIntersecting);
        setRevealed(
          entry.isIntersecting && entry.intersectionRatio >= REVEAL_RATIO,
        );
      },
      { threshold: [0, REVEAL_RATIO] },
    );
    observer.observe(element);

    return () => observer.disconnect();
  }, [ref, enabled]);

  return { revealed, active };
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
  // null until the client has looked: false only in browsers without
  // IntersectionObserver, where the cycle can never run and the card must show
  // its finished state. Starting at null rather than false matters for the
  // reveal — a false first paint would show the solved card for one frame
  // before the effect hid it again, which is exactly the flash the fade is
  // supposed to replace.
  const [hasObserver, setHasObserver] = React.useState<boolean | null>(null);
  React.useEffect(() => {
    setHasObserver(typeof IntersectionObserver !== "undefined");
  }, []);
  // With reduced motion the observer never runs: nothing reveals, nothing
  // loops, the solved poll is simply there.
  const { revealed, active } = useSlotVisibility(ref, !shouldReduceMotion);

  // The cycle runs only while the card is in view, so scrolling to it always
  // starts from the top of the story rather than mid vote.
  const animated = active === true && !shouldReduceMotion;
  const { visibleRows, showTimes, decided: cycleDecided } = useCycle(animated);

  // Show the solved poll only when no animation will play: reduced motion, or
  // a confirmed absence of IntersectionObserver. Otherwise the cycle owns the
  // card from the first render, so it always begins on an empty card rather
  // than snapping back from a populated one when the observer reports.
  const solved = shouldReduceMotion || hasObserver === false;

  const rows = solved ? VOTES.length : visibleRows;
  const times = solved ? true : showTimes;
  const decided = solved ? true : cycleDecided;

  // The card starts hidden and only appears once the observer says the slot is
  // properly on screen, so scrolling down to the footer always shows the fade
  // rather than a card that was already sitting there. `solved` is the escape
  // hatch: with reduced motion or no observer nothing will ever reveal it, so
  // it has to be visible from the first paint.
  const shown = solved || revealed === true;

  return (
    // The observed slot itself never moves or fades. The reveal lives on the
    // panel inside it, so the transform cannot shift what the observer is
    // measuring and flip the reveal back and forth at the boundary.
    <div
      ref={ref}
      aria-hidden
      className={cn(
        "relative isolate flex items-center justify-center py-10",
        className,
      )}
    >
      {/* A dot grid filling the whole slot, dissolving well before the edges
          so the pattern has no hard border and reads as texture behind the
          panel rather than a box around it. */}
      <div
        className={cn(
          // Fills the slot's full width and bleeds up into the footer's top
          // padding, where the mask fades it out just shy of the border. No
          // sideways bleed: that would widen the page.
          "absolute -top-14 right-0 -bottom-10 left-0 -z-10",
          // Dots rather than ruled lines: far less ink for the same rhythm, so
          // it sits further back behind the panel. They carry more alpha than
          // the lines did because there is so much less of each one.
          "bg-[radial-gradient(--theme(--color-black/12%)_1px,transparent_1px)]",
          "bg-[size:24px_24px]",
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
      <div
        className={cn(
          "w-full max-w-sm space-y-1.5 rounded-xl border border-border-muted bg-white/55 p-3 shadow-[0_1px_2px_--theme(--color-black/5%),0_8px_24px_-4px_--theme(--color-black/8%)] backdrop-blur-sm",
          // Rises into place as the slot scrolls in and settles back as it
          // scrolls away.
          "transition-all duration-700 ease-out",
          shown ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0",
        )}
        // Only the entrance waits. Leaving has no delay, so scrolling away
        // starts clearing the card at once.
        style={{ transitionDelay: shown ? `${REVEAL_DELAY_MS}ms` : "0ms" }}
      >
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

        {/* One row per voter, arriving in turn. Every row stays mounted and
            merely turns transparent, so the block keeps its full height
            throughout and the footer never reflows. */}
        <div className="space-y-1.5">
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
                    // The winning column picks up a fill so the whole column,
                    // not just its header, reads as the agreed time. Same
                    // gray-200 as the name pills, so the card keeps one weight
                    // of grey rather than introducing a second, lighter one.
                    decided && column === WINNING_COLUMN && "bg-gray-200",
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
