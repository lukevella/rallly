import { createBreakpoint } from "react-use";

import { ClosedPoll } from "@/components/poll/closed-poll";
import DesktopPoll from "@/components/poll/desktop-poll";
import MobilePoll from "@/components/poll/mobile-poll";

const useBreakpoint = createBreakpoint({ list: 320, table: 640 });

export function ResponsiveResults() {
  const breakpoint = useBreakpoint();
  const PollComponent = breakpoint === "table" ? DesktopPoll : MobilePoll;

  return (
    <ClosedPoll>
      <PollComponent />
    </ClosedPoll>
  );
}
