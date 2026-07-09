"use client";
import dynamic from "next/dynamic";
import { ChunkLoadErrorBoundary } from "@/components/chunk-load-error-boundary";
import { PollBrandingFromContext } from "@/components/poll/poll-branding";
import { retryDynamicImport } from "@/lib/retry-dynamic-import";

const AdminPage = dynamic(
  retryDynamicImport(() => import("./admin-page").then((mod) => mod.AdminPage)),
  { ssr: false },
);

export function AdminPageLoader() {
  return (
    <>
      <PollBrandingFromContext />
      <ChunkLoadErrorBoundary>
        <AdminPage />
      </ChunkLoadErrorBoundary>
    </>
  );
}
