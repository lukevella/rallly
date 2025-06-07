import { PageSkeleton } from "@/app/components/page-layout";
import { RouterLoadingIndicator } from "@/components/router-loading-indicator";

export default async function Loading() {
  return (
    <>
      <RouterLoadingIndicator />
      <PageSkeleton />
    </>
  );
}
