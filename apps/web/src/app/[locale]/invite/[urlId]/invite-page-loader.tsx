"use client";
import dynamic from "next/dynamic";
import { PollBrandingFromContext } from "@/features/poll/components/poll-branding";

// Deliberately client-only: the page is built around Intl-formatted dates
// and the viewer's timezone, neither of which can be rendered on the server
// (no zone cookie on first visit, and Intl output differs across engines).
// The page's tRPC prefetches still matter — they seed the client query cache
// via HydrationBoundary so useSuspenseQuery resolves without a round-trip.
const InvitePage = dynamic(
  () => import("./invite-page").then((mod) => mod.InvitePage),
  { ssr: false },
);

export function InvitePageLoader() {
  return (
    <>
      <PollBrandingFromContext />
      <InvitePage />
    </>
  );
}
