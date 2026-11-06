"use client";

import { Card } from "@rallly/ui/card";
import * as React from "react";
import { createBreakpoint } from "react-use";
import DesktopPoll from "@/features/poll/components/desktop-poll";
import MobilePoll from "@/features/poll/components/mobile-poll";
import { PollOutcome } from "@/features/poll/components/poll-outcome";

const useBreakpoint = createBreakpoint({ list: 320, table: 640 });

/**
 * `cardClassName` restyles the poll's own card, for a page that already
 * frames it (the invite page drops the frame inside its combined card).
 */
export function ResponsiveResults({
  cardClassName,
  desktopHeaderStart,
}: {
  cardClassName?: string;
  /** Goes before the desktop table's title; the mobile list has no header. */
  desktopHeaderStart?: React.ReactNode;
}) {
  const breakpoint = useBreakpoint();

  // Memoized so the frame keeps its identity and the outcome notice inside
  // it is not remounted on every render.
  const Frame = React.useMemo(
    () =>
      function Frame({ children }: { children: React.ReactNode }) {
        return <Card className={cardClassName}>{children}</Card>;
      },
    [cardClassName],
  );

  return (
    <PollOutcome frame={Frame}>
      {breakpoint === "table" ? (
        <DesktopPoll
          className={cardClassName}
          headerStart={desktopHeaderStart}
        />
      ) : (
        <MobilePoll className={cardClassName} />
      )}
    </PollOutcome>
  );
}
