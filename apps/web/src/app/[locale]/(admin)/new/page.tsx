import { PageContainer, PageContent } from "@/app/components/page-layout";
import { CreatePoll } from "@/components/create-poll";

export default async function Page() {
  return (
    <PageContainer>
      <PageContent>
        <CreatePoll />
      </PageContent>
    </PageContainer>
  );
}
