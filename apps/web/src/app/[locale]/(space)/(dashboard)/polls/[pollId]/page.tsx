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
import { OverviewSection } from "./components/overview-section";

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
      loadPollActivity(pollId, 5),
    ],
  );

  return (
    <div className="space-y-8 px-7.5 pt-4 pb-8">
      <OverviewSection
        title={
          <Trans
            i18nKey="pollOverviewPopularDates"
            defaults="Most popular dates"
          />
        }
        viewAllHref={`/polls/${pollId}/dates`}
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
              <Trans i18nKey="pollOverviewNoVotes" defaults="No votes yet" />
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
      <OverviewSection
        title={
          <Trans
            i18nKey="pollOverviewRecentResponses"
            defaults="Recent responses"
          />
        }
        viewAllHref={
          participants.length > 0 ? `/polls/${pollId}/responses` : undefined
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
      <OverviewSection
        title={
          <Trans
            i18nKey="pollOverviewRecentActivity"
            defaults="Recent activity"
          />
        }
        viewAllHref={`/polls/${pollId}/activity`}
      >
        {activity.length > 0 ? (
          <PollActivityList
            activity={activity}
            timeZone={poll.timeZone}
            className="pt-2"
          />
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
        )}
      </OverviewSection>
    </div>
  );
}
