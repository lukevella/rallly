import { loadPoll } from "@/features/poll/loaders";

export default async function Page({
  params,
}: {
  params: Promise<{ pollId: string }>;
}) {
  const { pollId } = await params;
  await loadPoll(pollId);
  return null;
}
