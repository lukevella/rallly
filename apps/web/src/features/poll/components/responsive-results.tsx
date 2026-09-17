"use client";

import { Card } from "@rallly/ui/card";
import { createBreakpoint } from "react-use";
import DesktopPoll from "@/features/poll/components/desktop-poll";
import MobilePoll from "@/features/poll/components/mobile-poll";
import { PollOutcome } from "@/features/poll/components/poll-outcome";

const useBreakpoint = createBreakpoint({ list: 320, table: 640 });

export function ResponsiveResults() {
  const breakpoint = useBreakpoint();
  const PollComponent = breakpoint === "table" ? DesktopPoll : MobilePoll;

  return (
    <PollOutcome frame={Card}>
      <PollComponent />
    </PollOutcome>
  );
}
