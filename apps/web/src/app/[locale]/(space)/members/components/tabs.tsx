import {
  PageTabs,
  PageTabsContent,
  PageTabsList,
  PageTabsTrigger,
} from "@/app/components/page-tabs";
import { Trans } from "@/components/trans";
import type { SpaceMemberRole } from "@/features/spaces/schema";

export const MembersTabs = ({
  value = "all",
  children,
}: {
  value?: "all" | SpaceMemberRole;
  children: React.ReactNode;
}) => {
  return (
    <PageTabs name="role" value={value}>
      <PageTabsList>
        <PageTabsTrigger value="all">
          <Trans i18nKey="allMembers" defaults="All" />
        </PageTabsTrigger>
        <PageTabsTrigger value="member">
          <Trans i18nKey="member" defaults="Member" />
        </PageTabsTrigger>
        <PageTabsTrigger value="admin">
          <Trans i18nKey="admin" defaults="Admin" />
        </PageTabsTrigger>
      </PageTabsList>
      <PageTabsContent value={value}>{children}</PageTabsContent>
    </PageTabs>
  );
};
