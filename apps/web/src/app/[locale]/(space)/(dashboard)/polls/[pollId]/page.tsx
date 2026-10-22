import { InboxIcon } from "lucide-react";
import {
  EmptyState,
  EmptyStateDescription,
  EmptyStateIcon,
  EmptyStateTitle,
} from "@/components/empty-state";
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
import { Trans } from "@/i18n/client";
import { InviteesCard } from "./components/invitees-card";
import { NextStepCard } from "./components/next-step-card";
import { OverviewLayout } from "./components/overview-layout";
import { OverviewSection } from "./components/overview-section";
import { PollDescriptionCard } from "./components/poll-description-card";
import { RecentResponsesList } from "./components/recent-responses-list";

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
    <OverviewLayout
      thread={
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
            <div className="pl-4">
              <div
                aria-hidden
                className="ml-6 h-4 w-px -translate-x-1/2 bg-border"
              />
              <PollActivityList
                activity={thread}
                timeZone={poll.timeZone}
                compact
                pollCreatorName={pollCreatorName}
                participantImages={Object.fromEntries(
                  participants.map(({ id, image }) => [id, image]),
                )}
                className="pl-3"
              />
            </div>
          ) : null}
          {/* The thread ends in the next step, as a pull request ends in its
              merge box, joined to the activity by the same rail */}
          <div className="pl-4">
            <div
              aria-hidden
              className="ml-6 h-4 w-px -translate-x-1/2 bg-border"
            />
          </div>
          <NextStepCard
            options={rankedOptions}
            participantCount={results.participantCount}
          />
        </PollProvider>
      }
      cards={
        <>
          <PollProvider
            poll={adminPoll.poll}
            participants={adminPoll.participants}
            comments={adminPoll.comments}
            viewerRole="admin"
          >
            <InviteesCard invites={invites} />
          </PollProvider>
          <OverviewSection
            title={<Trans i18nKey="participants" defaults="Participants" />}
            viewAllHref={
              participants.length > 0
                ? `/polls/${pollId}/participants`
                : undefined
            }
            count={participants.length}
          >
            {participants.length > 0 ? (
              <RecentResponsesList
                pollId={pollId}
                responses={participants.slice(0, 5)}
              />
            ) : (
              <EmptyState className="py-10">
                <EmptyStateIcon>
                  <InboxIcon />
                </EmptyStateIcon>
                <EmptyStateTitle>
                  <Trans
                    i18nKey="pollOverviewNoResponses"
                    defaults="No responses yet"
                  />
                </EmptyStateTitle>
                <EmptyStateDescription>
                  <Trans
                    i18nKey="pollOverviewNoResponsesDescription"
                    defaults="Responses will show up here once participants vote."
                  />
                </EmptyStateDescription>
              </EmptyState>
            )}
          </OverviewSection>
        </>
      }
    />
  );
}
