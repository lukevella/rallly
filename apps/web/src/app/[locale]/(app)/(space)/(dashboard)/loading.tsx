import { PageSkeleton } from "@/app/components/page-layout";
import { RouterLoadingIndicator } from "@/components/router-loading-indicator";

export default function Loading() {
  return (
    <>
      <RouterLoadingIndicator />
      <PageSkeleton />
    </>
  );
}
