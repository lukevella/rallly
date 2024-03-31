import React from "react";
import { createBreakpoint } from "react-use";

import DesktopPoll from "@/components/poll/desktop-poll";
import MobilePoll from "@/components/poll/mobile-poll";

const useBreakpoint = createBreakpoint({ list: 640, table: 1024 });

export function PollViz() {
  const breakpoint = useBreakpoint();
  const PollComponent = breakpoint === "table" ? DesktopPoll : MobilePoll;
  return <PollComponent />;
}
