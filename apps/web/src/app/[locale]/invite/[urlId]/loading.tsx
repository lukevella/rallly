import {
  PageContainer,
  PageContent,
  PageHeader,
} from "@/app/components/page-layout";
import { Skeleton, SkeletonCard } from "@/components/skeleton";

export default function Loading() {
  return (
    <PageContainer>
      <PageHeader className="justify-end flex" variant="ghost">
        <Skeleton className="w-32 h-9" />
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
