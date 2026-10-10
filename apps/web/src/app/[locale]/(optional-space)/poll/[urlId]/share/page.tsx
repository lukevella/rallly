import { Suspense } from "react";
import { SharePage } from "@/features/poll/components/share-page";
import { loadAdminPollInvites } from "@/features/poll/loaders";

// The read sits below the Suspense boundary so the route shell flushes
// before it resolves. The layout has already proven the viewer hosts the
// poll; the loader reuses that gate.
async function SharePageWithInvites({
  params,
}: {
  params: Promise<{ urlId: string }>;
}) {
  const { urlId } = await params;
  const invites = await loadAdminPollInvites(urlId);

  return <SharePage hasInvites={invites.length > 0} />;
}

export default function Page({
  params,
}: {
  params: Promise<{ urlId: string }>;
}) {
  return (
    <Suspense>
      <SharePageWithInvites params={params} />
    </Suspense>
  );
}
