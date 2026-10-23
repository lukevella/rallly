import { redirect } from "next/navigation";

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ pollId: string }>;
  searchParams: Promise<{ responseId?: string | string[] }>;
}) {
  const [{ pollId }, { responseId }] = await Promise.all([
    params,
    searchParams,
  ]);
  redirect(
    typeof responseId === "string"
      ? `/polls/${pollId}/participants?responseId=${encodeURIComponent(responseId)}`
      : `/polls/${pollId}/participants`,
  );
}
