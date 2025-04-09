import { RocketIcon } from "lucide-react";

import { SpacesPageIcon } from "@/app/components/page-icons";
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
import { Trans } from "@/components/trans";

export default function TeamsPage() {
  return (
    <PageContainer>
      <PageHeader>
        <PageTitle>
          <SpacesPageIcon />
          <Trans i18nKey="spaces" defaults="Spaces" />
        </PageTitle>
      </PageHeader>
      <PageContent>
        <EmptyState className="py-12">
          <EmptyStateIcon>
            <RocketIcon />
          </EmptyStateIcon>
          <EmptyStateTitle>Team Management Coming Soon</EmptyStateTitle>
          <EmptyStateDescription>
            Collaborate with your team members and manage permissions in one
            place.
          </EmptyStateDescription>
        </EmptyState>
      </PageContent>
    </PageContainer>
  );
}
