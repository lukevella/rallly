import { ActivityIcon } from "lucide-react";
import {
  EmptyState,
  EmptyStateDescription,
  EmptyStateIcon,
  EmptyStateTitle,
} from "@/components/empty-state";
import { PollActivityList } from "@/features/activity/components/poll-activity-list";
import { loadPoll, loadPollActivity } from "@/features/poll/loaders";
import { Trans } from "@/i18n/client";

export default async function Page({
  params,
}: {
  params: Promise<{ pollId: string }>;
}) {
  const { pollId } = await params;
  const [poll, activity] = await Promise.all([
    loadPoll(pollId),
    loadPollActivity(pollId),
  ]);

  if (activity.length === 0) {
    return (
      <EmptyState className="h-96">
        <EmptyStateIcon>
          <ActivityIcon />
        </EmptyStateIcon>
        <EmptyStateTitle>
          <Trans i18nKey="pollOverviewNoActivity" defaults="No activity yet" />
        </EmptyStateTitle>
        <EmptyStateDescription>
          <Trans
            i18nKey="pollActivityPageEmptyDescription"
            defaults="Activity on this poll will show up here."
          />
        </EmptyStateDescription>
      </EmptyState>
    );
  }

  return (
    <div className="px-7.5 pt-4 pb-8">
      <PollActivityList activity={activity} timeZone={poll.timeZone} />
    </div>
  );
}
