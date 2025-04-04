import { LinkIcon } from "lucide-react";

import {
  PageContainer,
  PageContent,
  PageHeader,
  PageTitle,
} from "@/app/components/page-layout";
import {
  EmptyState,
  EmptyStateDescription,
  EmptyStateIcon,
  EmptyStateTitle,
} from "@/components/empty-state";

export default function Page() {
  return (
    <PageContainer>
      <PageHeader>
        <PageTitle>Links</PageTitle>
      </PageHeader>
      <PageContent>
        <EmptyState className="py-12">
          <EmptyStateIcon>
            <LinkIcon />
          </EmptyStateIcon>
          <EmptyStateTitle>Scheduling Links</EmptyStateTitle>
          <EmptyStateDescription>
            A scheduling link is a unique URL that can be shared with others to
            share your availability and schedule an event.
          </EmptyStateDescription>
        </EmptyState>
      </PageContent>
    </PageContainer>
  );
}
