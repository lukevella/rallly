import { cn } from "@rallly/ui";
import { MousePointerClickIcon, SearchXIcon } from "lucide-react";
import {
  EmptyState,
  EmptyStateIcon,
  EmptyStateTitle,
} from "@/components/empty-state";
import { PollActivityList } from "@/features/activity/components/poll-activity-list";
import {
  PollResponseDetail,
  PollResponseDetailCard,
} from "@/features/poll/components/poll-response-detail";
import { PollResponsesList } from "@/features/poll/components/poll-responses-list";
import {
  loadOptionalPollResponse,
  loadPoll,
  loadPollParticipants,
  loadPollResponseActivity,
  loadPollResults,
} from "@/features/poll/loaders";
import { Trans } from "@/i18n/client";

async function ResponseDetail({
  pollId,
  responseId,
}: {
  pollId: string;
  responseId: string;
}) {
  const [poll, response, results, activity] = await Promise.all([
    loadPoll(pollId),
    loadOptionalPollResponse(pollId, responseId),
    loadPollResults(pollId),
    loadPollResponseActivity(pollId, responseId),
  ]);

  if (!response) {
    return (
      <PollResponseDetailCard className="flex items-center justify-center">
        <EmptyState>
          <EmptyStateIcon>
            <SearchXIcon />
          </EmptyStateIcon>
          <EmptyStateTitle>
            <Trans
              i18nKey="pollResponseDetailNotFound"
              defaults="This response no longer exists"
            />
          </EmptyStateTitle>
        </EmptyState>
      </PollResponseDetailCard>
    );
  }

  return (
    <PollResponseDetail
      pollId={pollId}
      pollOpen={poll.status === "open"}
      kind={results.kind}
      timeZone={poll.timeZone}
      response={response}
      options={results.options}
      activity={
        <PollActivityList activity={activity} timeZone={poll.timeZone} />
      }
    />
  );
}

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ pollId: string }>;
  searchParams: Promise<{ responseId?: string | string[] }>;
}) {
  const [{ pollId }, { responseId: rawResponseId }] = await Promise.all([
    params,
    searchParams,
  ]);
  const responseId =
    typeof rawResponseId === "string" ? rawResponseId : undefined;
  const [poll, participants] = await Promise.all([
    loadPoll(pollId),
    loadPollParticipants(pollId),
  ]);

  if (participants.length === 0) {
    return (
      <PollResponsesList
        pollId={pollId}
        participants={participants}
        pollOpen={poll.status === "open"}
      />
    );
  }

  // Below md one pane shows at a time: the list, or the selected response.
  return (
    <div className="flex h-full min-h-0">
      <div
        className={cn(
          "min-h-0 w-full overflow-y-auto md:w-80 md:shrink-0 lg:w-96",
          responseId ? "hidden md:block" : "block",
        )}
      >
        <PollResponsesList
          pollId={pollId}
          participants={participants}
          pollOpen={poll.status === "open"}
          selectedId={responseId}
          compact
        />
      </div>
      <div
        className={cn(
          "min-h-0 min-w-0 flex-1",
          responseId ? "block" : "hidden md:block",
        )}
      >
        {responseId ? (
          <ResponseDetail pollId={pollId} responseId={responseId} />
        ) : (
          <PollResponseDetailCard className="flex items-center justify-center">
            <EmptyState>
              <EmptyStateIcon>
                <MousePointerClickIcon />
              </EmptyStateIcon>
              <EmptyStateTitle>
                <Trans
                  i18nKey="pollResponseDetailSelect"
                  defaults="Select a response to see its details"
                />
              </EmptyStateTitle>
            </EmptyState>
          </PollResponseDetailCard>
        )}
      </div>
    </div>
  );
}
