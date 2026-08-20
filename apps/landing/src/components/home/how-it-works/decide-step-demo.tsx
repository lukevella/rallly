"use client";

import { cn } from "@rallly/ui";
import { VoteIcon } from "@rallly/ui/vote-icon";
import * as m from "motion/react-m";
import { DemoScreen } from "../hero-demo/demo-frame";

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

const VOTER_STAGGER = 0.22;
const WINNER_DELAY = ROWS[0].votes.length * VOTER_STAGGER + 0.1;

export const DecideStepDemo = ({ play }: { play: boolean }) => (
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
            play && row.winner ? "rgb(238 242 255)" : "rgba(255,255,255,0)",
        }}
        transition={{ duration: 0.3, delay: play ? WINNER_DELAY : 0 }}
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
                className="h-1.5 w-12 rounded-full bg-indigo-600"
                initial={false}
                animate={{ opacity: play ? 1 : 0 }}
                transition={{ duration: 0.3, delay: play ? WINNER_DELAY : 0 }}
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
                play
                  ? { opacity: 1, scale: 1, y: 0 }
                  : { opacity: 0, scale: 0.6, y: -4 }
              }
              transition={{
                duration: 0.3,
                delay: play ? voteIndex * VOTER_STAGGER : 0,
              }}
            >
              <VoteIcon type={vote} className="size-3.5" />
            </m.div>
          ))}
        </div>
      </m.div>
    ))}
  </DemoScreen>
);
