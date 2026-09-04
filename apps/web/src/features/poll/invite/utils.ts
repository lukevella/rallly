export type PollInviteStatus = "sent" | "opened" | "responded";

/**
 * Revoked invites are filtered out by the read, so they never reach here.
 * Responding always consumes the invite, so a joined participant outranks an
 * open that may or may not have happened first.
 */
export function derivePollInviteStatus(invite: {
  openedAt: Date | null;
  participantId: string | null;
}): PollInviteStatus {
  if (invite.participantId) {
    return "responded";
  }
  if (invite.openedAt) {
    return "opened";
  }
  return "sent";
}
