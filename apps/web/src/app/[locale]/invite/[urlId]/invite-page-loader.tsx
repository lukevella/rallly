"use client";
import dynamic from "next/dynamic";
import { ChunkLoadErrorBoundary } from "@/components/chunk-load-error-boundary";
import { PollBrandingFromContext } from "@/components/poll/poll-branding";
import { retryDynamicImport } from "@/lib/retry-dynamic-import";

const InvitePage = dynamic(
  retryDynamicImport(() =>
    import("./invite-page").then((mod) => mod.InvitePage),
  ),
  { ssr: false },
);

export function InvitePageLoader() {
  return (
    <>
      <PollBrandingFromContext />
      <ChunkLoadErrorBoundary>
        <InvitePage />
      </ChunkLoadErrorBoundary>
    </>
  );
}
