import { ActivityIcon, CalendarIcon, InboxIcon } from "lucide-react";
import {
  EmptyState,
  EmptyStateDescription,
  EmptyStateIcon,
  EmptyStateTitle,
} from "@/components/empty-state";
import { PollActivityList } from "@/features/activity/components/poll-activity-list";
import { PollResponsesList } from "@/features/poll/components/poll-responses-list";
import { PollTopDates } from "@/features/poll/components/poll-top-dates";
import {
  loadPoll,
  loadPollActivity,
  loadPollParticipants,
  loadPollResults,
  loadPollTopOptions,
} from "@/features/poll/loaders";
import { Trans } from "@/i18n/client";
import { OverviewLayout } from "./components/overview-layout";
import { OverviewSection } from "./components/overview-section";

function OverviewCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-card-border bg-card p-4">
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

  return (
    <OverviewLayout
      thread={
        activity.length > 0 ? (
          <PollActivityList activity={activity} timeZone={poll.timeZone} />
        ) : (
          <EmptyState className="py-10">
            <EmptyStateIcon>
              <ActivityIcon />
            </EmptyStateIcon>
            <EmptyStateTitle>
              <Trans
                i18nKey="pollOverviewNoActivity"
                defaults="No activity yet"
              />
            </EmptyStateTitle>
          </EmptyState>
        )
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
                  className="-mx-3.5"
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
              title={
                <Trans
                  i18nKey="pollOverviewRecentResponses"
                  defaults="Recent responses"
                />
              }
              viewAllHref={
                participants.length > 0
                  ? `/polls/${pollId}/participants`
                  : undefined
              }
              count={participants.length}
            >
              {participants.length > 0 ? (
                <PollResponsesList
                  pollId={pollId}
                  participants={participants.slice(0, 5)}
                  pollOpen={poll.status === "open"}
                  className="-mx-4 px-0 py-0"
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
