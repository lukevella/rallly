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

/**
 * The per invitee link, relative. Shared by the email and the host's copy
 * action so the two can never point at different places. The same `token`
 * param carries a response's edit token: once the invitee responds their
 * response takes the invite's token, so this link keeps editing it.
 */
export function getPollInvitePath({
  pollId,
  token,
}: {
  pollId: string;
  token: string;
}) {
  return `/invite/${pollId}?token=${token}`;
}
