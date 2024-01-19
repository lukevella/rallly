import { PageContainer, PageHeader } from "@/app/components/page-layout";
import { Skeleton } from "@/components/skeleton";

export default function Loading() {
  return (
    <PageContainer>
      <PageHeader className="flex justify-end" variant="ghost">
        <Skeleton className="h-9 w-32" />
      </PageHeader>
    </PageContainer>
  );
}
