import {
  PageContainer,
  PageContent,
  PageHeader,
} from "@/app/components/page-layout";
import { Skeleton, SkeletonCard } from "@/components/skeleton";

export default function Loading() {
  return (
    <PageContainer>
      <PageHeader className="flex items-center gap-x-4">
        <Skeleton className="w-9 h-9" />
        <Skeleton className="w-48 h-5" />
      </PageHeader>
      <PageContent>
        <div className="max-w-4xl mx-auto space-y-6">
          <SkeletonCard className="h-72 w-full" />
          <SkeletonCard className="h-96 w-full" />
          <hr />
          <SkeletonCard className="h-64 w-full" />
        </div>
      </PageContent>
    </PageContainer>
  );
}
