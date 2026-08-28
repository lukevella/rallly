"use client";

import { cn } from "@rallly/ui";
import { VoteIcon } from "@rallly/ui/vote-icon";
import * as m from "motion/react-m";
import * as React from "react";
import { DemoScreen } from "../hero-demo/demo-frame";
import { ACCENT, ACCENT_EDGE } from "./accent";
import type { CursorStop } from "./demo-cursor";
import { DemoCursor } from "./demo-cursor";
import type { Playback } from "./motion";
import { EASE_OUT, EXIT } from "./motion";

// A textless mock of the results: one row per option with real vote icons,
// the winner highlighted. Bars stand in for copy so it doesn't compete with
// the section text. Sized to fit the 4:3 artboard on the how it works
// section.
//
// On play the votes arrive a participant at a time, so each column drops in as
// one response. Until they are all in every option looks the same: the winning
// row starts as grey as the rest and only takes on the accent once the last
// vote lands, so the demo shows the decision being made rather than announcing
// it up front.
const ROWS: { votes: ("yes" | "ifNeedBe" | "no")[]; winner: boolean }[] = [
  { votes: ["yes", "yes", "yes", "yes"], winner: true },
  { votes: ["yes", "no", "yes", "no"], winner: false },
  { votes: ["yes", "ifNeedBe", "yes", "no"], winner: false },
  { votes: ["no", "yes", "ifNeedBe", "no"], winner: false },
];

// Votes land per participant, so the column is the beat. Rows within a column
// are nudged apart a little so a response reads as arriving rather than
// stamping four cells at once.
const VOTER_STAGGER = 0.09;
const ROW_STAGGER = 0.02;
const VOTES_DONE = ROWS[0].votes.length * VOTER_STAGGER + 0.12;
// The cursor picks the winner once the votes are in, and the accent follows
// the click, so the highlight reads as chosen rather than announced.
const CLICK_AT = VOTES_DONE + 0.07;
const WINNER_DELAY = CLICK_AT + 0.06;

// Where the cursor crosses into frame: the height step 2's cursor left at
// (its copy button, in stage coordinates), so the two read as one pointer
// crossing the gap between the cards.
const ENTER_Y = 51;

export const DecideStepDemo = ({ playback }: { playback: Playback }) => {
  const on = playback !== "idle";
  const instant = playback === "done";
  const winnerRef = React.useRef<HTMLDivElement>(null);
  const stops = React.useMemo<CursorStop[]>(
    () => [{ ref: winnerRef, at: CLICK_AT, click: true }],
    [],
  );
  // Every part of the winner's accent — edge, wash, label — arrives on the
  // same beat, so the row reads as one thing lighting up.
  const accentIn = instant
    ? { duration: 0 }
    : on
      ? { duration: 0.34, ease: EASE_OUT, delay: WINNER_DELAY }
      : EXIT;
  return (
    <>
      <DemoScreen className="space-y-1.5 p-4">
        {ROWS.map((row, rowIndex) => (
          <div
            // biome-ignore lint/suspicious/noArrayIndexKey: static wireframe rows
            key={rowIndex}
            ref={row.winner ? winnerRef : undefined}
            // A gradient cannot live in border-color, so the edge is a padded
            // backdrop behind the surface. Every row keeps the same shape, and
            // the winner's gradient edge cross-fades over the grey one.
            className="relative rounded-md bg-gray-200 p-px"
          >
            {row.winner ? (
              <m.div
                className={cn(
                  "pointer-events-none absolute inset-0 rounded-md",
                  ACCENT_EDGE,
                )}
                initial={false}
                animate={{ opacity: on ? 1 : 0 }}
                transition={accentIn}
              />
            ) : null}
            <div className="relative overflow-hidden rounded-[5px] bg-white">
              {row.winner ? (
                <m.div
                  className={cn("pointer-events-none absolute inset-0", ACCENT)}
                  initial={false}
                  animate={{ opacity: on ? 0.08 : 0 }}
                  transition={accentIn}
                />
              ) : null}
              <div className="relative flex items-center justify-between gap-3 px-2.5 py-2">
                <div className="min-w-0 space-y-1.5">
                  <div className="relative h-1.5 w-16 overflow-hidden rounded-full bg-gray-300">
                    {row.winner ? (
                      <m.div
                        className={cn("absolute inset-0", ACCENT)}
                        initial={false}
                        animate={{ opacity: on ? 1 : 0 }}
                        transition={accentIn}
                      />
                    ) : null}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-10 rounded-full bg-gray-200" />
                    {row.winner ? (
                      <m.div
                        className={cn("h-1.5 w-12 rounded-full", ACCENT)}
                        initial={false}
                        animate={{ opacity: on ? 1 : 0, scaleX: on ? 1 : 0.4 }}
                        style={{ originX: 0 }}
                        transition={
                          instant
                            ? { duration: 0 }
                            : on
                              ? {
                                  type: "spring",
                                  duration: 0.5,
                                  bounce: 0.24,
                                  delay: WINNER_DELAY + 0.08,
                                }
                              : EXIT
                        }
                      />
                    ) : null}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  {row.votes.map((vote, voteIndex) => (
                    <m.div
                      // biome-ignore lint/suspicious/noArrayIndexKey: static wireframe votes
                      key={voteIndex}
                      initial={false}
                      animate={
                        on
                          ? { opacity: 1, scale: 1, y: 0 }
                          : { opacity: 0, scale: 0.82, y: -3 }
                      }
                      transition={
                        instant
                          ? { duration: 0 }
                          : on
                            ? {
                                type: "spring",
                                duration: 0.46,
                                bounce: 0.38,
                                delay:
                                  voteIndex * VOTER_STAGGER +
                                  rowIndex * ROW_STAGGER,
                              }
                            : EXIT
                      }
                    >
                      <VoteIcon type={vote} className="size-3.5" />
                    </m.div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </DemoScreen>
      <DemoCursor playback={playback} stops={stops} enterY={ENTER_Y} />
    </>
  );
};
