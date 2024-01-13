import { PageContainer, PageHeader } from "@/app/components/page-layout";
import { Skeleton } from "@/components/skeleton";

export default function Loading() {
  return (
    <PageContainer>
      <PageHeader className="flex items-center gap-x-4">
        <Skeleton className="w-9 h-9" />
        <Skeleton className="w-48 h-5" />
      </PageHeader>
    </PageContainer>
  );
}
