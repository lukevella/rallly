import { PollDatesList } from "@/features/poll/components/poll-dates-list";
import { loadPoll, loadPollResults } from "@/features/poll/loaders";

export default async function Page({
  params,
}: {
  params: Promise<{ pollId: string }>;
}) {
  const { pollId } = await params;
  const [poll, results] = await Promise.all([
    loadPoll(pollId),
    loadPollResults(pollId),
  ]);
  return (
    <PollDatesList
      kind={results.kind}
      options={results.options}
      participantCount={results.participantCount}
      timeZone={poll.timeZone}
    />
  );
}
