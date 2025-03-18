import { PuzzleIcon } from "lucide-react";

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

export default function IntegrationsPage() {
  return (
    <PageContainer>
      <PageHeader>
        <PageTitle>Integrations</PageTitle>
      </PageHeader>
      <PageContent>
        <EmptyState className="py-12">
          <EmptyStateIcon>
            <PuzzleIcon />
          </EmptyStateIcon>
          <EmptyStateTitle>Integrations Coming Soon</EmptyStateTitle>
          <EmptyStateDescription>
            Connect Rallly with your favorite tools and services to streamline
            your workflow.
          </EmptyStateDescription>
        </EmptyState>
      </PageContent>
    </PageContainer>
  );
}
