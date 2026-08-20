"use client";

import { cn } from "@rallly/ui";
import { MailIcon, MessageCircleIcon, SendIcon } from "lucide-react";
import * as m from "motion/react-m";
import { DemoScreen } from "../hero-demo/demo-frame";
import { ACCENT } from "./accent";
import { EASE_OUT, EXIT } from "./motion";
import { PressButton } from "./press-button";

// A textless mock of the invite step: a link field with a copy button, ways
// to send it, and the group it goes out to. Bars stand in for copy so it
// doesn't compete with the section text. Fills the 4:3 frame on the how it
// works section.
//
// On play a pointer travels to the copy button, presses it, and the link field
// flips to a confirmation. The pointer is drawn rather than implied so the
// button dip reads as a click.
const CHANNELS = [
  { key: "email", icon: MailIcon, width: "w-20" },
  { key: "chat", icon: MessageCircleIcon, width: "w-14" },
  { key: "direct", icon: SendIcon, width: "w-24" },
];

const PRESS_AT = 0.42;
const COPIED_AT = PRESS_AT + 0.1;

// Copying recolors the url in place rather than swapping it for a shorter
// confirmation, so the field keeps the same block at the same width and the
// accent is what signals the copy.
const SWAP = { duration: 0.2, ease: EASE_OUT } as const;

export const ShareStepDemo = ({ play }: { play: boolean }) => (
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
              animate={{ opacity: play ? 1 : 0 }}
              transition={{ ...SWAP, delay: play ? COPIED_AT : 0 }}
            />
          </div>
        </div>
        <div className="relative shrink-0">
          <PressButton
            play={play}
            delay={PRESS_AT}
            className={cn("h-7 w-14 rounded-md", ACCENT)}
          />
          <m.div
            className="pointer-events-none absolute top-4 left-6"
            initial={false}
            animate={
              play ? { opacity: 1, x: 0, y: 0 } : { opacity: 0, x: 28, y: 24 }
            }
            transition={
              play
                ? {
                    x: { type: "spring", duration: 0.5, bounce: 0.2 },
                    y: { type: "spring", duration: 0.5, bounce: 0.2 },
                    opacity: { duration: 0.14, ease: EASE_OUT },
                  }
                : { ...EXIT, opacity: { duration: 0.12 } }
            }
          >
            <CursorIcon />
          </m.div>
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
);

const CursorIcon = () => (
  <svg
    aria-hidden="true"
    viewBox="0 0 12 12"
    className="size-4 fill-gray-900 stroke-white drop-shadow-sm"
    strokeWidth="1"
  >
    <path d="M1 1 L1 10 L3.5 7.6 L5.3 11 L7 10.1 L5.2 6.9 L8.6 6.7 Z" />
  </svg>
);
