import { PollActivityList } from "@/features/activity/components/poll-activity-list";
import { PollProvider } from "@/features/poll/client";
import { EventMetaDescription } from "@/features/poll/components/event-meta-description";
import {
  loadAdminPoll,
  loadPoll,
  loadPollActivity,
  loadPollInvites,
  loadPollParticipants,
  loadPollResults,
} from "@/features/poll/loaders";
import { NextStepCard } from "./components/next-step-card";
import { PollDescriptionCard } from "./components/poll-description-card";

export default async function Page({
  params,
}: {
  params: Promise<{ pollId: string }>;
}) {
  const { pollId } = await params;
  const [poll, participants, results, activity, invites] = await Promise.all([
    loadPoll(pollId),
    loadPollParticipants(pollId),
    loadPollResults(pollId),
    loadPollActivity(pollId),
    loadPollInvites(pollId),
  ]);
  // The description card reads the full poll from the poll provider.
  const adminPoll = await loadAdminPoll(pollId);
  // Oldest first, like a conversation, so poll created leads the thread.
  const thread = [...activity].reverse();
  // The poll created event records only the creator's id. The poll's user is
  // the creator unless the organizer has since changed, in which case the
  // first change names who it was taken from.
  const firstOrganizerChange = thread.find(
    ({ event }) => event.type === "poll_organizer_changed",
  )?.event;
  const pollCreatorName =
    firstOrganizerChange?.type === "poll_organizer_changed"
      ? firstOrganizerChange.payload.from.name
      : adminPoll.poll.user?.name;

  // Most popular first; ties keep date order.
  const rankedOptions = [...results.options].sort(
    (a, b) =>
      b.score - a.score || a.startTime.getTime() - b.startTime.getTime(),
  );

  return (
    // One centred column: the poll, its activity, then the next step
    <div className="px-6 py-6">
      <div className="mx-auto w-full max-w-[680px]">
        <PollProvider
          poll={adminPoll.poll}
          participants={adminPoll.participants}
          comments={adminPoll.comments}
          viewerRole="admin"
        >
          <PollDescriptionCard
            // Rendered here so the markdown parser stays on the server
            description={
              <EventMetaDescription
                className="text-muted-foreground"
                content={adminPoll.poll.description}
              />
            }
            options={results.options}
          />
          {thread.length > 0 ? (
            // Indented so the timeline stems from under the card, as a pull
            // request's commits do from its description.
            <div className="px-5">
              <div
                aria-hidden
                className="ml-7 h-6 w-px -translate-x-1/2 bg-border"
              />
              <PollActivityList
                activity={thread}
                timeZone={poll.timeZone}
                compact
                continues
                pollCreatorName={pollCreatorName}
                participantImages={Object.fromEntries(
                  participants.map(({ id, image }) => [id, image]),
                )}
                participantVotes={Object.fromEntries(
                  participants.map(({ id, voteCounts }) => [id, voteCounts]),
                )}
                className="pl-3"
              />
            </div>
          ) : null}
          {/* The thread ends in the next step, as a pull request ends in its
              merge box, joined to the activity by the same rail */}
          <div className="pl-5">
            <div
              aria-hidden
              className="ml-7 h-6 w-px -translate-x-1/2 bg-border"
            />
          </div>
          {/* Pinned to the bottom of the viewport while the thread scrolls,
              so the decision stays in reach; it settles into place at the
              end of the thread */}
          <div className="sticky bottom-4 z-10">
            <NextStepCard
              options={rankedOptions}
              participantCount={results.participantCount}
              invites={
                invites.length > 0
                  ? {
                      pending: invites.filter((invite) => !invite.responded)
                        .length,
                    }
                  : null
              }
            />
          </div>
        </PollProvider>
      </div>
    </div>
  );
}
