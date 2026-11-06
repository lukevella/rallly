import { SessionRefresher } from "@/components/session-refresher";
import { PollProvider } from "@/features/poll/client";
import { LegacyPollContextProvider } from "@/features/poll/components/poll-context-provider";
import { VisibilityProvider } from "@/features/poll/components/visibility";
import type { loadInvitePoll } from "@/features/poll/loaders";
import { UserProvider } from "@/features/user/client";

/**
 * The client context every invite tab that works with the poll needs: the
 * viewer, the poll as a participant sees it, its responses and comments.
 */
export function InvitePollProviders({
  invitePoll: { poll, participants, comments, linkedParticipantIds, user },
  children,
}: {
  invitePoll: Awaited<ReturnType<typeof loadInvitePoll>>;
  children: React.ReactNode;
}) {
  return (
    <>
      <SessionRefresher />
      <UserProvider user={user}>
        <PollProvider
          poll={poll}
          participants={participants}
          comments={comments}
          linkedParticipantIds={linkedParticipantIds}
          viewerRole="participant"
        >
          <LegacyPollContextProvider>
            <VisibilityProvider>{children}</VisibilityProvider>
          </LegacyPollContextProvider>
        </PollProvider>
      </UserProvider>
    </>
  );
}

/**
 * The emailed link's token. `invite` is the param older invite emails carry;
 * both name the same token. A repeated param arrives as an array; only a
 * single value is a token.
 */
export function getInviteToken({
  token,
  invite,
}: {
  token?: string | string[];
  invite?: string | string[];
}) {
  return [token, invite].find(
    (value): value is string => typeof value === "string",
  );
}
