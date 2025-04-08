import { UsersIcon } from "lucide-react";

import { HomePageIcon, TeamPageIcon } from "@/app/components/page-icons";
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

export default function TeamPage() {
  return (
    <PageContainer>
      <PageHeader>
        <PageTitle>
          <TeamPageIcon />
          Team
        </PageTitle>
      </PageHeader>
      <PageContent>
        <EmptyState className="py-12">
          <EmptyStateIcon>
            <UsersIcon />
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
