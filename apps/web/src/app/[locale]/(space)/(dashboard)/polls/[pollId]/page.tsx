import { CalendarIcon, InboxIcon } from "lucide-react";
import {
  EmptyState,
  EmptyStateDescription,
  EmptyStateIcon,
  EmptyStateTitle,
} from "@/components/empty-state";
import { OptimizedAvatarImage } from "@/components/optimized-avatar-image";
import { PollActivityList } from "@/features/activity/components/poll-activity-list";
import { PollProvider } from "@/features/poll/client";
import { EventCard } from "@/features/poll/components/event-card";
import { EventMetaDescription } from "@/features/poll/components/event-meta-description";
import { PollTopDates } from "@/features/poll/components/poll-top-dates";
import {
  loadAdminPoll,
  loadPoll,
  loadPollActivity,
  loadPollParticipants,
  loadPollResults,
  loadPollTopOptions,
} from "@/features/poll/loaders";
import { Trans } from "@/i18n/client";
import { OverviewLayout } from "./components/overview-layout";
import { OverviewSection } from "./components/overview-section";
import { RecentResponsesList } from "./components/recent-responses-list";

function OverviewCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-card-border bg-card p-3 text-xs">
      {children}
    </div>
  );
}

export default async function Page({
  params,
}: {
  params: Promise<{ pollId: string }>;
}) {
  const { pollId } = await params;
  const [poll, participants, results, topOptions, activity] = await Promise.all(
    [
      loadPoll(pollId),
      loadPollParticipants(pollId),
      loadPollResults(pollId),
      loadPollTopOptions(pollId, 3),
      loadPollActivity(pollId),
    ],
  );
  // The event card reads the full poll from the poll provider.
  const adminPoll = await loadAdminPoll(pollId);
  // The event card stands in for the poll created event, as a pull
  // request's description does. Oldest first, like a conversation.
  const thread = activity
    .filter(({ event }) => event.type !== "poll_created")
    .reverse();

  return (
    <OverviewLayout
      thread={
        <PollProvider
          poll={adminPoll.poll}
          participants={adminPoll.participants}
          comments={adminPoll.comments}
          viewerRole="admin"
        >
          {/* The event card participants see on the invite page, with the
              organizer's avatar beside it as a pull request's author is */}
          <div className="flex gap-3">
            <OptimizedAvatarImage
              size="lg"
              name={adminPoll.poll.user?.name ?? "?"}
              src={adminPoll.poll.user?.image ?? undefined}
            />
            <div className="min-w-0 flex-1">
              <EventCard
                // Rendered here so the markdown parser stays on the server
                description={
                  <EventMetaDescription
                    className="mt-1 text-muted-foreground"
                    content={adminPoll.poll.description}
                  />
                }
              />
            </div>
          </div>
          {thread.length > 0 ? (
            // Indented past the avatar so the timeline stems from under the
            // card, as a pull request's commits do from its description.
            <div className="pl-13">
              <div
                aria-hidden
                className="ml-6 h-4 w-px -translate-x-1/2 bg-border"
              />
              <PollActivityList
                activity={thread}
                timeZone={poll.timeZone}
                compact
                className="pl-3"
              />
            </div>
          ) : null}
        </PollProvider>
      }
      cards={
        <>
          <OverviewCard>
            <OverviewSection
              title={
                <Trans
                  i18nKey="pollOverviewPopularDates"
                  defaults="Most popular dates"
                />
              }
              viewAllHref={`/polls/${pollId}/results`}
              count={results.options.length}
            >
              {topOptions.options.length > 0 ? (
                <PollTopDates
                  options={topOptions.options}
                  participantCount={topOptions.participantCount}
                  timeZone={poll.timeZone}
                />
              ) : (
                <EmptyState className="py-10">
                  <EmptyStateIcon>
                    <CalendarIcon />
                  </EmptyStateIcon>
                  <EmptyStateTitle>
                    <Trans
                      i18nKey="pollOverviewNoVotes"
                      defaults="No votes yet"
                    />
                  </EmptyStateTitle>
                  <EmptyStateDescription>
                    <Trans
                      i18nKey="pollOverviewNoPopularDates"
                      defaults="Popular dates will show up here once participants vote."
                    />
                  </EmptyStateDescription>
                </EmptyState>
              )}
            </OverviewSection>
          </OverviewCard>
          <OverviewCard>
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
          </OverviewCard>
        </>
      }
    />
  );
}
