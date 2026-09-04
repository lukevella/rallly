"use client";

import * as React from "react";
import { recordPollInviteOpenAction } from "@/features/poll/invite/actions";

/**
 * Records that an emailed invite link was followed. Fired from the client so
 * that mail scanners fetching the link ahead of the reader never count as an
 * open. Renders nothing.
 */
export function InviteOpenRecorder({
  pollId,
  token,
}: {
  pollId: string;
  token: string;
}) {
  React.useEffect(() => {
    recordPollInviteOpenAction({ pollId, token });
  }, [pollId, token]);

  return null;
}
