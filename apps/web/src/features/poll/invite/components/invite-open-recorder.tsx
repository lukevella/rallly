"use client";

import * as React from "react";
import { recordPollInviteOpenAction } from "@/features/poll/invite/actions";

// Only input a person produces. Scroll is left out because scripts can
// cause it, and isTrusted rules out events a script dispatches.
const interactionEvents = ["pointerdown", "keydown", "wheel", "touchstart"];

/**
 * Records that an emailed invite link was followed, on the reader's first
 * interaction with the page. Mail scanners such as Microsoft Defender's Safe
 * Links load the link in a real browser and run its JavaScript, so neither
 * the request nor a mount effect proves a person opened it. Renders nothing.
 */
export function InviteOpenRecorder({
  pollId,
  token,
}: {
  pollId: string;
  token: string;
}) {
  React.useEffect(() => {
    const controller = new AbortController();
    const record = (event: Event) => {
      if (!event.isTrusted) {
        return;
      }
      controller.abort();
      recordPollInviteOpenAction({ pollId, token });
    };
    for (const type of interactionEvents) {
      window.addEventListener(type, record, {
        capture: true,
        passive: true,
        signal: controller.signal,
      });
    }
    return () => controller.abort();
  }, [pollId, token]);

  return null;
}
