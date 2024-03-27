import { PageContainer, PageHeader } from "@/app/components/page-layout";
import { Skeleton } from "@/components/skeleton";

export default function Loading() {
  return (
    <PageContainer>
      <PageHeader className="flex items-center gap-x-4">
        <Skeleton className="size-9" />
        <Skeleton className="h-5 w-48" />
      </PageHeader>
    </PageContainer>
  );
}
