import { redirect } from "next/navigation";

// Details, dates and settings are edited together on one page now.
export default async function Page({
  params,
}: {
  params: Promise<{ urlId: string }>;
}) {
  const { urlId } = await params;
  redirect(`/poll/${urlId}/edit`);
}
