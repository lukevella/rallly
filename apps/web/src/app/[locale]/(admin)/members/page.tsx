import { UsersIcon } from "lucide-react";

import { MembersPageIcon } from "@/app/components/page-icons";
import {
  PageContainer,
  PageContent,
  PageDescription,
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

export default function MembersPage() {
  return (
    <PageContainer>
      <PageHeader>
        <PageTitle>
          <MembersPageIcon />
          <Trans i18nKey="members" defaults="Members" />
        </PageTitle>
        <PageDescription>
          <Trans
            i18nKey="membersPageDesc"
            defaults="Manage your team members and their permissions"
          />
        </PageDescription>
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
