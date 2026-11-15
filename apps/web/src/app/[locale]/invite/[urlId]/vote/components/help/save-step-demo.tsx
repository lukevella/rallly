"use client";

import { CircleCheckIcon } from "lucide-react";
import * as m from "motion/react-m";
import * as React from "react";
import type { CursorStop } from "./demo-cursor";
import { DemoCursor } from "./demo-cursor";
import { DemoBar, DemoScreen } from "./demo-parts";
import type { Playback } from "./motion";
import { EASE_OUT, EXIT, POP } from "./motion";
import { PressButton } from "./press-button";

// The cursor fills in the name, then the email, then saves. Typing is a
// bar growing across the field.
const NAME_AT = 0.45;
const EMAIL_AT = 1.25;
const TYPE_DURATION = 0.5;
const SUBMIT_AT = 2.05;
const SAVED_AT = SUBMIT_AT + 0.25;

function DemoField({
  fieldRef,
  playback,
  at,
  className,
}: {
  fieldRef: React.RefObject<HTMLDivElement | null>;
  playback: Playback;
  at: number;
  className: string;
}) {
  const on = playback !== "idle";
  return (
    <div className="space-y-1.5">
      <DemoBar tone="soft" className="w-10" />
      <div
        ref={fieldRef}
        className="flex h-7 items-center rounded-md border bg-background px-2"
      >
        <m.div
          className={className}
          style={{ originX: 0 }}
          initial={false}
          animate={{ scaleX: on ? 1 : 0 }}
          transition={
            playback === "done"
              ? { duration: 0 }
              : on
                ? { duration: TYPE_DURATION, ease: "linear", delay: at + 0.1 }
                : EXIT
          }
        >
          <DemoBar className="w-full" />
        </m.div>
      </div>
    </div>
  );
}

export function SaveStepDemo({ playback }: { playback: Playback }) {
  const on = playback !== "idle";
  const instant = playback === "done";
  const nameRef = React.useRef<HTMLDivElement>(null);
  const emailRef = React.useRef<HTMLDivElement>(null);
  const submitRef = React.useRef<HTMLDivElement>(null);
  const stops = React.useMemo<CursorStop[]>(
    () => [
      { ref: nameRef, at: NAME_AT, click: true },
      { ref: emailRef, at: EMAIL_AT, click: true },
      { ref: submitRef, at: SUBMIT_AT, click: true },
    ],
    [],
  );

  return (
    <>
      <DemoScreen className="space-y-3 p-4">
        <DemoField
          fieldRef={nameRef}
          playback={playback}
          at={NAME_AT}
          className="w-20"
        />
        <DemoField
          fieldRef={emailRef}
          playback={playback}
          at={EMAIL_AT}
          className="w-32"
        />
        <div className="flex items-center justify-between gap-3 pt-1">
          <m.div
            className="flex items-center gap-1.5"
            initial={false}
            animate={on ? { opacity: 1, y: 0 } : { opacity: 0, y: 4 }}
            transition={
              instant
                ? { duration: 0 }
                : on
                  ? { duration: 0.3, ease: EASE_OUT, delay: SAVED_AT }
                  : EXIT
            }
          >
            <m.div
              initial={false}
              animate={{ scale: on ? 1 : 0.5 }}
              transition={
                instant
                  ? { duration: 0 }
                  : on
                    ? { ...POP, delay: SAVED_AT }
                    : EXIT
              }
            >
              <CircleCheckIcon className="size-4 text-green-500" />
            </m.div>
            <DemoBar className="w-16" />
          </m.div>
          <div ref={submitRef}>
            <PressButton
              playback={playback}
              delay={SUBMIT_AT}
              className="h-7 w-16 rounded-md bg-primary"
            />
          </div>
        </div>
      </DemoScreen>
      <DemoCursor playback={playback} stops={stops} />
    </>
  );
}
