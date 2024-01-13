import { PageContainer, PageHeader } from "@/app/components/page-layout";
import { Skeleton } from "@/components/skeleton";

export default function Loading() {
  return (
    <PageContainer>
      <PageHeader className="justify-end flex" variant="ghost">
        <Skeleton className="w-32 h-9" />
      </PageHeader>
    </PageContainer>
  );
}
