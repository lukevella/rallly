import { redirect } from "next/navigation";

export default async function Page({
  params,
}: {
  params: Promise<{ pollId: string }>;
}) {
  const { pollId } = await params;
  redirect(`/polls/${pollId}?view=list`);
}
