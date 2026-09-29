import { Suspense } from "react";
import { loadPollConferencingOptions } from "@/features/poll/loaders";
import { EditDetailsForm } from "./components/edit-details-form";

async function EditDetails({ params }: { params: Promise<{ urlId: string }> }) {
  const { urlId } = await params;
  const conferencing = await loadPollConferencingOptions(urlId);
  return <EditDetailsForm conferencing={conferencing} />;
}

export default function Page({
  params,
}: {
  params: Promise<{ urlId: string }>;
}) {
  return (
    <Suspense>
      <EditDetails params={params} />
    </Suspense>
  );
}
