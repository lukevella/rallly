"use client";

import { cn } from "@rallly/ui";
import * as m from "motion/react-m";
import { DemoScreen } from "../hero-demo/demo-frame";
import { ACCENT } from "./accent";
import type { Playback } from "./motion";
import { EASE_OUT, EXIT, STAGGER } from "./motion";
import { PressButton } from "./press-button";

// A textless mock of the poll creation form: title field and a month
// calendar with a weekly cadence of selected days. Bars stand in for copy so
// it doesn't compete with the section text. Sized to fit the 4:3 artboard on
// the how it works section.
//
// On play the picked dates land one at a time in the order listed, then the
// submit button presses.
const WEEKS = 4;
const START_OFFSET = 2;

// Scattered rather than a single column: a weekly cadence reads as a
// recurring event, where the point here is someone picking whichever days
// happen to suit. Indices are cells in the WEEKS x 7 grid, listed in the
// order they get picked, which is deliberately not left to right.
const SELECTED = [10, 4, 17, 23, 12, 27];
const SUBMIT_DELAY = SELECTED.length * STAGGER + 0.12;

export const CreateStepDemo = ({ playback }: { playback: Playback }) => {
  const on = playback !== "idle";
  const instant = playback === "done";
  return (
    <DemoScreen className="space-y-2 p-4">
      <div className="space-y-1.5">
        <div className="h-1.5 w-8 rounded-full bg-gray-300" />
        <div className="flex h-6 items-center rounded-md border border-gray-200 px-2">
          <div className="h-1.5 w-24 rounded-full bg-gray-300" />
        </div>
      </div>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <div className="h-1.5 w-14 rounded-full bg-gray-300" />
          <div className="h-1.5 w-10 rounded-full bg-gray-200" />
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 7 }, (_, index) => (
            <div
              // biome-ignore lint/suspicious/noArrayIndexKey: weekday header cells are positional
              key={index}
              className="flex justify-center py-0.5"
            >
              <div className="h-1 w-2 rounded-full bg-gray-200" />
            </div>
          ))}
          {Array.from({ length: WEEKS * 7 }, (_, index) => {
            if (index < START_OFFSET) {
              return (
                <div
                  // biome-ignore lint/suspicious/noArrayIndexKey: calendar cells are positional
                  key={index}
                />
              );
            }
            const pickedAt = SELECTED.indexOf(index);
            if (pickedAt === -1) {
              return (
                <div
                  // biome-ignore lint/suspicious/noArrayIndexKey: calendar cells are positional
                  key={index}
                  className="h-3.5 rounded bg-gray-100"
                />
              );
            }
            return (
              <m.div
                // biome-ignore lint/suspicious/noArrayIndexKey: calendar cells are positional
                key={index}
                className="h-3.5 rounded bg-gray-100"
                initial={false}
                animate={
                  on
                    ? {
                        backgroundColor: "#d1d5db",
                        scale: instant ? 1 : [0.88, 1],
                      }
                    : { backgroundColor: "#f3f4f6", scale: 1 }
                }
                transition={
                  instant
                    ? { duration: 0 }
                    : on
                      ? {
                          backgroundColor: {
                            duration: 0.22,
                            ease: EASE_OUT,
                            delay: pickedAt * STAGGER,
                          },
                          scale: {
                            type: "spring",
                            duration: 0.44,
                            bounce: 0.42,
                            delay: pickedAt * STAGGER,
                          },
                        }
                      : EXIT
                }
              />
            );
          })}
        </div>
      </div>
      <div className="flex justify-end border-gray-200/60 border-t pt-2">
        <PressButton
          playback={playback}
          delay={SUBMIT_DELAY}
          className={cn("h-7 w-14 rounded-md", ACCENT)}
        />
      </div>
    </DemoScreen>
  );
};
