"use client";

import { VoteIcon } from "@rallly/ui/vote-icon";
import { CalendarCheckIcon } from "lucide-react";
import * as m from "motion/react-m";
import { DemoBar, DemoScreen } from "./demo-parts";
import type { Playback } from "./motion";
import { EASE_OUT, EXIT, POP } from "./motion";

// Responses arrive one participant at a time; once they are all in, the
// best option lights up and the invite goes out.
const ROWS: { votes: ("yes" | "ifNeedBe" | "no")[]; winner: boolean }[] = [
  { votes: ["yes", "yes", "no", "yes"], winner: false },
  { votes: ["yes", "yes", "yes", "yes"], winner: true },
  { votes: ["no", "yes", "no", "no"], winner: false },
];

const START = 0.3;
const VOTER_STAGGER = 0.16;
const ROW_STAGGER = 0.03;
const VOTES_DONE = START + ROWS[0].votes.length * VOTER_STAGGER + 0.2;
const WINNER_AT = VOTES_DONE + 0.15;
const INVITE_AT = WINNER_AT + 0.55;

export function DecideStepDemo({ playback }: { playback: Playback }) {
  const on = playback !== "idle";
  const instant = playback === "done";
  const timed = (delay: number, transition: object = POP) =>
    instant ? { duration: 0 } : on ? { ...transition, delay } : EXIT;

  return (
    <div className="space-y-3">
      <DemoScreen className="space-y-1.5 p-3">
        {ROWS.map((row, rowIndex) => (
          <div
            // biome-ignore lint/suspicious/noArrayIndexKey: static wireframe rows
            key={rowIndex}
            className="relative rounded-md border"
          >
            {row.winner ? (
              <m.div
                className="pointer-events-none absolute -inset-px rounded-md bg-primary/5 ring-2 ring-primary"
                initial={false}
                animate={{ opacity: on ? 1 : 0 }}
                transition={timed(WINNER_AT, {
                  duration: 0.34,
                  ease: EASE_OUT,
                })}
              />
            ) : null}
            <div className="relative flex items-center justify-between gap-3 px-2.5 py-2">
              <div className="space-y-1.5">
                <DemoBar className="w-16" />
                <DemoBar tone="soft" className="w-10" />
              </div>
              <div className="flex items-center gap-1">
                {row.votes.map((vote, voteIndex) => (
                  <m.div
                    // biome-ignore lint/suspicious/noArrayIndexKey: static wireframe votes
                    key={voteIndex}
                    initial={false}
                    animate={
                      on
                        ? { opacity: 1, scale: 1, y: 0 }
                        : { opacity: 0, scale: 0.8, y: -3 }
                    }
                    transition={timed(
                      START +
                        voteIndex * VOTER_STAGGER +
                        rowIndex * ROW_STAGGER,
                    )}
                  >
                    <VoteIcon round type={vote} size="sm" className="size-4" />
                  </m.div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </DemoScreen>
      <m.div
        className="ml-auto flex w-fit items-center gap-2 rounded-lg border bg-card px-2.5 py-2 shadow-sm"
        initial={false}
        animate={
          on
            ? { opacity: 1, y: 0, scale: 1 }
            : { opacity: 0, y: 6, scale: 0.96 }
        }
        transition={timed(INVITE_AT)}
      >
        <div className="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <CalendarCheckIcon className="size-3.5" />
        </div>
        <div className="space-y-1.5">
          <DemoBar className="w-16" />
          <DemoBar tone="soft" className="w-10" />
        </div>
      </m.div>
    </div>
  );
}
