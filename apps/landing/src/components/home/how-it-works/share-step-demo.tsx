"use client";

import { cn } from "@rallly/ui";
import { MailIcon, MessageCircleIcon, SendIcon } from "lucide-react";
import * as m from "motion/react-m";
import * as React from "react";
import { DemoScreen } from "../hero-demo/demo-frame";
import { ACCENT } from "./accent";
import type { CursorStop } from "./demo-cursor";
import { DemoCursor } from "./demo-cursor";
import type { Playback } from "./motion";
import { EASE_OUT } from "./motion";
import { PressButton } from "./press-button";

// A textless mock of the invite step: a link field with a copy button, ways
// to send it, and the group it goes out to. Bars stand in for copy so it
// doesn't compete with the section text. Fills the 4:3 frame on the how it
// works section.
//
// On play the copy button presses and the link field flips to a
// confirmation.
const CHANNELS = [
  { key: "email", icon: MailIcon, width: "w-20" },
  { key: "chat", icon: MessageCircleIcon, width: "w-14" },
  { key: "direct", icon: SendIcon, width: "w-24" },
];

const PRESS_AT = 0.42;
const COPIED_AT = PRESS_AT + 0.1;

// Where the cursor crosses into frame: the height step 1's cursor left at
// (its submit button, in stage coordinates), so the two read as one pointer
// crossing the gap between the cards.
const ENTER_Y = 205;

// Copying recolors the url in place rather than swapping it for a shorter
// confirmation, so the field keeps the same block at the same width and the
// accent is what signals the copy.
const SWAP = { duration: 0.2, ease: EASE_OUT } as const;

export const ShareStepDemo = ({ playback }: { playback: Playback }) => {
  const on = playback !== "idle";
  const instant = playback === "done";
  const copyRef = React.useRef<HTMLDivElement>(null);
  const stops = React.useMemo<CursorStop[]>(
    () => [{ ref: copyRef, at: PRESS_AT, click: true }],
    [],
  );
  return (
    <>
      <DemoScreen className="space-y-2 p-4">
        <div className="space-y-1.5">
          <div className="h-1.5 w-12 rounded-full bg-gray-300" />
          <div className="flex items-center gap-2">
            <div className="flex h-7 min-w-0 flex-1 items-center rounded-md border border-gray-200 bg-gray-50 px-2">
              {/* The accent fades over the resting bar rather than replacing its
              class, so the recolor transitions instead of snapping. */}
              <div className="relative h-1.5 w-28 shrink-0 overflow-hidden rounded-full bg-gray-300">
                <m.div
                  className={cn("absolute inset-0", ACCENT)}
                  initial={false}
                  animate={{ opacity: on ? 1 : 0 }}
                  transition={
                    instant
                      ? { duration: 0 }
                      : { ...SWAP, delay: on ? COPIED_AT : 0 }
                  }
                />
              </div>
            </div>
            <div ref={copyRef} className="shrink-0">
              <PressButton
                playback={playback}
                delay={PRESS_AT}
                className={cn("h-7 w-14 rounded-md", ACCENT)}
              />
            </div>
          </div>
        </div>
        <div className="space-y-1.5">
          {CHANNELS.map((channel) => (
            <div
              key={channel.key}
              className="flex items-center gap-2 rounded-md border border-gray-200 px-2 py-1.5"
            >
              <div className="flex size-5 shrink-0 items-center justify-center rounded bg-gray-100">
                <channel.icon className="size-3 text-gray-400" />
              </div>
              <div
                className={cn("h-1.5 rounded-full bg-gray-300", channel.width)}
              />
            </div>
          ))}
        </div>
        <div className="flex items-center gap-3 border-gray-200/60 border-t pt-3">
          <div className="flex shrink-0 -space-x-1.5">
            {[0, 1, 2, 3].map((participant) => (
              <div
                key={participant}
                className="size-6 rounded-full bg-gray-300 ring-2 ring-white"
              />
            ))}
          </div>
          <div className="min-w-0 flex-1 space-y-1.5">
            <div className="h-1.5 max-w-32 rounded-full bg-gray-200" />
            <div className="h-1.5 max-w-20 rounded-full bg-gray-200" />
          </div>
        </div>
      </DemoScreen>
      <DemoCursor playback={playback} stops={stops} enterY={ENTER_Y} />
    </>
  );
};
