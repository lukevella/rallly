import { redirect } from "next/navigation";
import { Suspense } from "react";
import { loadFooterLinks } from "@/features/instance-settings/loaders";
import { loadAdminPoll } from "@/features/poll/loaders";
import { loadOptionalActiveSpace } from "@/features/space/loaders";
import { AdminPageLoader } from "./admin-page-loader";

// Keeps the route shell synchronous so it can flush before the reads
// resolve. The page below is client-only, so this is the one server
// boundary they can be loaded from.
async function AdminPageWithFooterLinks({
  params,
}: {
  params: Promise<{ urlId: string }>;
}) {
  const { urlId } = await params;
  const [footerLinks, activeSpace, { poll }] = await Promise.all([
    loadFooterLinks(),
    loadOptionalActiveSpace(),
    loadAdminPoll(urlId),
  ]);

  // Polls in the active space are managed on the poll page. This page stays
  // for the rest: guest polls, and polls in a space the host isn't in now.
  if (activeSpace && poll.spaceId === activeSpace.id) {
    redirect(`/polls/${poll.id}`);
  }

  // The attribution action updates the active space, and only its admins
  // may; the page checks the poll belongs to that space before showing it.
  const manageableSpace =
    activeSpace?.role === "admin" ? { id: activeSpace.id } : null;

  return (
    <AdminPageLoader
      footerLinks={footerLinks}
      manageableSpace={manageableSpace}
    />
  );
}

export default function Page({
  params,
}: {
  params: Promise<{ urlId: string }>;
}) {
  return (
    <Suspense>
      <AdminPageWithFooterLinks params={params} />
    </Suspense>
  );
}
