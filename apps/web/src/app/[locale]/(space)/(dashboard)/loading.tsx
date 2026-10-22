import { PageShellSkeleton } from "@/components/page-shell";
import { RouterLoadingIndicator } from "@/components/router-loading-indicator";

export default function Loading() {
  return (
    <>
      <RouterLoadingIndicator />
      <PageShellSkeleton />
    </>
  );
}
