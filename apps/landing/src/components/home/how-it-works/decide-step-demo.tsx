"use client";

import { cn } from "@rallly/ui";
import { VoteIcon } from "@rallly/ui/vote-icon";
import * as m from "motion/react-m";
import { DemoScreen } from "../hero-demo/demo-frame";
import { ACCENT } from "./accent";
import type { Playback } from "./motion";
import { EASE_OUT, EXIT } from "./motion";

// A textless mock of the results: one row per option with real vote icons,
// the winner highlighted. Bars stand in for copy so it doesn't compete with
// the section text. Sized to fit the 4:3 artboard on the how it works
// section.
//
// On play the votes arrive a participant at a time, so each column drops in as
// one response, and the winning row lights up once they're all in.
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
const WINNER_DELAY = ROWS[0].votes.length * VOTER_STAGGER + 0.12;

export const DecideStepDemo = ({ playback }: { playback: Playback }) => {
  const on = playback !== "idle";
  const instant = playback === "done";
  return (
    <DemoScreen className="space-y-1.5 p-4">
      {ROWS.map((row, rowIndex) => (
        <m.div
          // biome-ignore lint/suspicious/noArrayIndexKey: static wireframe rows
          key={rowIndex}
          className={cn(
            "flex items-center justify-between gap-3 rounded-md border px-2.5 py-2",
            row.winner ? "border-indigo-200" : "border-gray-200",
          )}
          initial={false}
          animate={{
            backgroundColor:
              on && row.winner ? "rgb(238 242 255)" : "rgba(255,255,255,0)",
          }}
          transition={
            instant
              ? { duration: 0 }
              : on
                ? { duration: 0.34, ease: EASE_OUT, delay: WINNER_DELAY }
                : EXIT
          }
        >
          <div className="min-w-0 space-y-1.5">
            <div
              className={cn(
                "h-1.5 w-16 rounded-full",
                row.winner ? "bg-indigo-400" : "bg-gray-300",
              )}
            />
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
                            voteIndex * VOTER_STAGGER + rowIndex * ROW_STAGGER,
                        }
                      : EXIT
                }
              >
                <VoteIcon type={vote} className="size-3.5" />
              </m.div>
            ))}
          </div>
        </m.div>
      ))}
    </DemoScreen>
  );
};
